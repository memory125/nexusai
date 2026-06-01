// MCP stdio transport: spawns a child process and provides newline-delimited JSON
// over its stdin/stdout. The transport is internally Arc-shared, so cloning is
// cheap and only the I/O tasks are unique.

use anyhow::{Context, Result};
use serde_json::Value;
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::{mpsc, oneshot, Mutex};
use tokio::time::timeout;

use super::protocol::{JsonRpcError, JsonRpcRequest, JsonRpcResponse};

type PendingMap = Arc<Mutex<HashMap<u64, oneshot::Sender<Result<Value, JsonRpcError>>>>>;

#[derive(Debug, Clone)]
pub struct StdioServerSpec {
    pub command: String,
    pub args: Vec<String>,
    pub env: HashMap<String, String>,
    pub cwd: Option<String>,
}

struct Inner {
    spec: StdioServerSpec,
    child: Mutex<Option<Child>>,
    next_id: AtomicU64,
    pending: PendingMap,
    write_tx: mpsc::Sender<String>,
    shutdown_flag: Arc<std::sync::atomic::AtomicBool>,
}

/// Stdio transport for an MCP server. Wraps a child process and a request/response
/// pump. Cloneable: clones share the same underlying process.
#[derive(Clone)]
pub struct StdioTransport {
    inner: Arc<Inner>,
}

impl StdioTransport {
    /// Spawn the configured process and start the I/O pump.
    pub async fn spawn(spec: StdioServerSpec) -> Result<Self> {
        let mut cmd = Command::new(&spec.command);
        cmd.args(&spec.args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);

        for (k, v) in &spec.env {
            cmd.env(k, v);
        }
        if let Some(cwd) = &spec.cwd {
            cmd.current_dir(cwd);
        }

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }

        let mut child = cmd
            .spawn()
            .with_context(|| format!("Failed to spawn MCP server: {} {:?}", spec.command, spec.args))?;

        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| anyhow::anyhow!("Missing stdout"))?;
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| anyhow::anyhow!("Missing stdin"))?;
        let stderr = child
            .stderr
            .take()
            .ok_or_else(|| anyhow::anyhow!("Missing stderr"))?;

        let (write_tx, write_rx) = mpsc::channel::<String>(64);
        let pending: PendingMap = Arc::new(Mutex::new(HashMap::new()));
        let shutdown_flag = Arc::new(std::sync::atomic::AtomicBool::new(false));

        // Writer task: drain write_rx into stdin.
        {
            let mut stdin = stdin;
            let mut rx = write_rx;
            let flag = shutdown_flag.clone();
            tokio::spawn(async move {
                while let Some(line) = rx.recv().await {
                    if flag.load(Ordering::Relaxed) {
                        break;
                    }
                    if stdin.write_all(line.as_bytes()).await.is_err() {
                        break;
                    }
                    if stdin.write_all(b"\n").await.is_err() {
                        break;
                    }
                    if stdin.flush().await.is_err() {
                        break;
                    }
                }
            });
        }

        // Reader task: parse newline-delimited JSON, route by id.
        {
            let pending = pending.clone();
            let flag = shutdown_flag.clone();
            let mut reader = BufReader::new(stdout).lines();
            tokio::spawn(async move {
                while let Ok(Some(line)) = reader.next_line().await {
                    if flag.load(Ordering::Relaxed) {
                        break;
                    }
                    let trimmed = line.trim();
                    if trimmed.is_empty() {
                        continue;
                    }
                    match serde_json::from_str::<JsonRpcResponse>(trimmed) {
                        Ok(resp) => {
                            if let Some(id) = resp.id {
                                let mut guard = pending.lock().await;
                                if let Some(tx) = guard.remove(&id) {
                                    let result = if let Some(err) = resp.error {
                                        Err(err)
                                    } else {
                                        Ok(resp.result.unwrap_or(Value::Null))
                                    };
                                    let _ = tx.send(result);
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("[mcp] failed to parse response: {} - line: {}", e, trimmed);
                        }
                    }
                }
            });
        }

        // Stderr task: forward server logs to the Tauri stderr.
        {
            let mut reader = BufReader::new(stderr).lines();
            let flag = shutdown_flag.clone();
            tokio::spawn(async move {
                while let Ok(Some(line)) = reader.next_line().await {
                    if flag.load(Ordering::Relaxed) {
                        break;
                    }
                    eprintln!("[mcp-server] {}", line);
                }
            });
        }

        Ok(Self {
            inner: Arc::new(Inner {
                spec,
                child: Mutex::new(Some(child)),
                next_id: AtomicU64::new(0),
                pending,
                write_tx,
                shutdown_flag,
            }),
        })
    }

    /// Send a JSON-RPC request and await its response.
    pub async fn request(
        &self,
        method: &str,
        params: Option<Value>,
        req_timeout: Duration,
    ) -> Result<Value> {
        let id = self.inner.next_id.fetch_add(1, Ordering::Relaxed) + 1;
        let req = JsonRpcRequest::new(id, method, params);
        let serialized = serde_json::to_string(&req)
            .with_context(|| format!("Failed to serialize request for {}", method))?;

        let (tx, rx) = oneshot::channel();
        {
            let mut g = self.inner.pending.lock().await;
            g.insert(id, tx);
        }

        if self.inner.write_tx.send(serialized).await.is_err() {
            let mut g = self.inner.pending.lock().await;
            g.remove(&id);
            anyhow::bail!("MCP transport closed: failed to enqueue request");
        }

        match timeout(req_timeout, rx).await {
            Ok(Ok(Ok(value))) => Ok(value),
            Ok(Ok(Err(err))) => {
                let mut g = self.inner.pending.lock().await;
                g.remove(&id);
                Err(anyhow::anyhow!("MCP error ({}): {}", err.code, err.message))
            }
            Ok(Err(_canceled)) => {
                let mut g = self.inner.pending.lock().await;
                g.remove(&id);
                anyhow::bail!("MCP request canceled")
            }
            Err(_elapsed) => {
                let mut g = self.inner.pending.lock().await;
                g.remove(&id);
                anyhow::bail!("MCP request timed out after {:?}", req_timeout)
            }
        }
    }

    /// Send a JSON-RPC notification (no response expected).
    pub async fn notify(&self, method: &str, params: Option<Value>) -> Result<()> {
        let id = self.inner.next_id.fetch_add(1, Ordering::Relaxed) + 1;
        let req = JsonRpcRequest::new(id, method, params);
        let serialized = serde_json::to_string(&req)
            .with_context(|| format!("Failed to serialize notification {}", method))?;
        self.inner
            .write_tx
            .send(serialized)
            .await
            .map_err(|_| anyhow::anyhow!("MCP transport closed: failed to enqueue notification"))
    }

    /// Returns true if the underlying child process is still running.
    pub async fn is_alive(&self) -> bool {
        let mut g = self.inner.child.lock().await;
        if let Some(child) = g.as_mut() {
            matches!(child.try_wait(), Ok(None))
        } else {
            false
        }
    }

    /// Returns the server spec used to launch this transport.
    pub fn spec(&self) -> &StdioServerSpec {
        &self.inner.spec
    }

    /// Kill the child process and stop the I/O tasks. Idempotent.
    pub async fn shutdown(&self) {
        self.inner
            .shutdown_flag
            .store(true, std::sync::atomic::Ordering::Relaxed);
        if let Some(mut child) = self.inner.child.lock().await.take() {
            let _ = child.kill().await;
        }
    }
}
