// Manages a collection of MCP server clients keyed by server id.

use anyhow::Result;
use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;

use super::client::{ConnectionState, McpClient, ServerCapabilities};
use super::protocol::{McpTool, McpResource, McpPrompt, McpToolCallResult};
use super::transport::StdioServerSpec;

#[derive(Debug, Clone, Serialize)]
pub struct ServerStatus {
    pub id: String,
    pub state: String,
    pub last_error: Option<String>,
    pub tool_count: usize,
    pub resource_count: usize,
    pub prompt_count: usize,
    pub server_info: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ConnectedServer {
    pub id: String,
    pub server_info: Option<String>,
    pub tools: Vec<McpTool>,
    pub resources: Vec<McpResource>,
    pub prompts: Vec<McpPrompt>,
}

#[derive(Debug, Clone, Serialize)]
pub struct McpCommandResult<T: Serialize> {
    pub ok: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

pub struct McpManager {
    clients: Arc<Mutex<HashMap<String, Arc<McpClient>>>>,
}

impl Default for McpManager {
    fn default() -> Self {
        Self::new()
    }
}

impl McpManager {
    pub fn new() -> Self {
        Self {
            clients: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Get or create a client by id.
    pub async fn get_or_create(&self, id: &str) -> Arc<McpClient> {
        let mut g = self.clients.lock().await;
        g.entry(id.to_string())
            .or_insert_with(|| Arc::new(McpClient::new(id)))
            .clone()
    }

    pub async fn get(&self, id: &str) -> Option<Arc<McpClient>> {
        let g = self.clients.lock().await;
        g.get(id).cloned()
    }

    pub async fn drop_client(&self, id: &str) {
        let mut g = self.clients.lock().await;
        if let Some(client) = g.remove(id) {
            client.disconnect().await;
        }
    }

    pub async fn connect(
        &self,
        id: &str,
        spec: StdioServerSpec,
    ) -> Result<ServerCapabilities> {
        let client = self.get_or_create(id).await;
        let result = client.connect(spec).await?;
        client.refresh_capabilities().await?;
        Ok(client.capabilities().await)
    }

    pub async fn disconnect(&self, id: &str) {
        if let Some(c) = self.get(id).await {
            c.disconnect().await;
        }
    }

    pub async fn list_tools(&self, id: &str) -> Result<Vec<McpTool>> {
        let c = self
            .get(id)
            .await
            .ok_or_else(|| anyhow::anyhow!("Unknown MCP server: {}", id))?;
        Ok(c.capabilities().await.tools)
    }

    pub async fn call_tool(
        &self,
        id: &str,
        name: &str,
        arguments: Value,
    ) -> Result<McpToolCallResult> {
        let c = self
            .get(id)
            .await
            .ok_or_else(|| anyhow::anyhow!("Unknown MCP server: {}", id))?;
        c.call_tool(name, arguments).await
    }

    pub async fn read_resource(&self, id: &str, uri: &str) -> Result<Value> {
        let c = self
            .get(id)
            .await
            .ok_or_else(|| anyhow::anyhow!("Unknown MCP server: {}", id))?;
        c.read_resource(uri).await
    }

    pub async fn status(&self, id: &str) -> Option<ServerStatus> {
        let c = self.get(id).await?;
        let state = c.state().await;
        let caps = c.capabilities().await;
        Some(ServerStatus {
            id: id.to_string(),
            state: match state {
                ConnectionState::Disconnected => "disconnected".to_string(),
                ConnectionState::Connecting => "connecting".to_string(),
                ConnectionState::Connected => "connected".to_string(),
                ConnectionState::Failed => "failed".to_string(),
            },
            last_error: c.last_error().await,
            tool_count: caps.tools.len(),
            resource_count: caps.resources.len(),
            prompt_count: caps.prompts.len(),
            server_info: caps.server_info,
        })
    }

    pub async fn status_all(&self) -> Vec<ServerStatus> {
        let ids: Vec<String> = {
            let g = self.clients.lock().await;
            g.keys().cloned().collect()
        };
        let mut out = Vec::with_capacity(ids.len());
        for id in ids {
            if let Some(s) = self.status(&id).await {
                out.push(s);
            }
        }
        out
    }

    pub async fn connected_servers(&self) -> Vec<ConnectedServer> {
        let g = self.clients.lock().await;
        let mut out = Vec::new();
        for (id, c) in g.iter() {
            if c.state().await == ConnectionState::Connected {
                let caps = c.capabilities().await;
                out.push(ConnectedServer {
                    id: id.clone(),
                    server_info: caps.server_info,
                    tools: caps.tools,
                    resources: caps.resources,
                    prompts: caps.prompts,
                });
            }
        }
        out
    }

    /// Aggregate all tools from all connected servers, with the owning server id
    /// embedded in the tool's `name` (`<serverId>__<toolName>`). Used by the
    /// frontend to present a unified tool list.
    pub async fn aggregate_tools(&self) -> Vec<ToolRef> {
        let servers = self.connected_servers().await;
        let mut out = Vec::new();
        for s in servers {
            for t in s.tools {
                out.push(ToolRef {
                    server_id: s.id.clone(),
                    server_info: s.server_info.clone(),
                    name: t.name.clone(),
                    description: t.description.clone(),
                    input_schema: t.input_schema,
                });
            }
        }
        out
    }

    pub async fn shutdown_all(&self) {
        let ids: Vec<String> = {
            let g = self.clients.lock().await;
            g.keys().cloned().collect()
        };
        for id in ids {
            if let Some(c) = self.get(&id).await {
                c.disconnect().await;
            }
        }
    }

    /// Build a `StdioServerSpec` from a frontend-friendly config struct.
    pub fn build_spec(
        command: String,
        args: Vec<String>,
        env: HashMap<String, String>,
        cwd: Option<String>,
        timeout_ms: Option<u64>,
    ) -> (StdioServerSpec, Duration) {
        let timeout = timeout_ms
            .map(Duration::from_millis)
            .unwrap_or(DEFAULT_SPEC_TIMEOUT);
        (
            StdioServerSpec {
                command,
                args,
                env,
                cwd,
            },
            timeout,
        )
    }
}

const DEFAULT_SPEC_TIMEOUT: Duration = Duration::from_secs(60);

#[derive(Debug, Clone, Serialize)]
pub struct ToolRef {
    pub server_id: String,
    pub server_info: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub input_schema: Value,
}
