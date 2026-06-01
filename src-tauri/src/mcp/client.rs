// High-level MCP client. Wraps a stdio transport and implements the MCP protocol
// methods (initialize handshake, tools/list, tools/call, resources/list,
// resources/read, prompts/list, prompts/get).

use anyhow::{Context, Result};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;

use super::protocol::{
    McpCapabilities, McpClientInfo, McpInitializeParams, McpInitializeResult,
    McpListPromptsResult, McpListResourcesResult, McpListToolsResult, McpPrompt,
    McpResource, McpTool, McpToolCallParams, McpToolCallResult,
};
use super::transport::{StdioServerSpec, StdioTransport};

const MCP_PROTOCOL_VERSION: &str = "2024-11-05";
const DEFAULT_REQUEST_TIMEOUT: Duration = Duration::from_secs(60);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConnectionState {
    Disconnected,
    Connecting,
    Connected,
    Failed,
}

#[derive(Debug, Clone, Default)]
pub struct ServerCapabilities {
    pub tools: Vec<McpTool>,
    pub resources: Vec<McpResource>,
    pub prompts: Vec<McpPrompt>,
    pub server_info: Option<String>,
}

pub struct McpClient {
    id: String,
    state: Arc<Mutex<ConnectionState>>,
    capabilities: Arc<Mutex<ServerCapabilities>>,
    last_error: Arc<Mutex<Option<String>>>,
    transport: Arc<Mutex<Option<StdioTransport>>>,
    timeout: Duration,
}

impl McpClient {
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            state: Arc::new(Mutex::new(ConnectionState::Disconnected)),
            capabilities: Arc::new(Mutex::new(ServerCapabilities::default())),
            last_error: Arc::new(Mutex::new(None)),
            transport: Arc::new(Mutex::new(None)),
            timeout: DEFAULT_REQUEST_TIMEOUT,
        }
    }

    pub fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }

    pub async fn connect(&self, spec: StdioServerSpec) -> Result<McpInitializeResult> {
        {
            let mut g = self.state.lock().await;
            *g = ConnectionState::Connecting;
        }
        {
            let mut g = self.last_error.lock().await;
            *g = None;
        }

        let transport = match StdioTransport::spawn(spec).await {
            Ok(t) => t,
            Err(e) => {
                let msg = format!("Failed to spawn MCP server: {}", e);
                {
                    let mut g = self.last_error.lock().await;
                    *g = Some(msg.clone());
                }
                {
                    let mut g = self.state.lock().await;
                    *g = ConnectionState::Failed;
                }
                return Err(e.context(msg));
            }
        };

        // MCP initialize handshake
        let init_params = McpInitializeParams {
            protocol_version: MCP_PROTOCOL_VERSION.to_string(),
            capabilities: McpCapabilities::default(),
            client_info: McpClientInfo {
                name: "NexusAI".to_string(),
                version: env!("CARGO_PKG_VERSION").to_string(),
            },
        };
        let init_result: McpInitializeResult = match transport
            .request("initialize", Some(serde_json::to_value(init_params)?), self.timeout)
            .await
        {
            Ok(v) => serde_json::from_value(v).context("Invalid initialize result")?,
            Err(e) => {
                transport.shutdown().await;
                let msg = format!("MCP initialize failed: {}", e);
                {
                    let mut g = self.last_error.lock().await;
                    *g = Some(msg.clone());
                }
                {
                    let mut g = self.state.lock().await;
                    *g = ConnectionState::Failed;
                }
                return Err(anyhow::anyhow!(msg));
            }
        };

        // Send notifications/initialized to complete the handshake.
        if let Err(e) = transport
            .notify("notifications/initialized", Some(json!({})))
            .await
        {
            eprintln!("[mcp:{}] notifications/initialized failed: {}", self.id, e);
        }

        {
            let mut g = self.capabilities.lock().await;
            g.server_info = Some(format!(
                "{} v{} (protocol {})",
                init_result.server_info.name,
                init_result.server_info.version,
                init_result.protocol_version
            ));
        }

        {
            let mut g = self.transport.lock().await;
            *g = Some(transport);
        }
        {
            let mut g = self.state.lock().await;
            *g = ConnectionState::Connected;
        }

        Ok(init_result)
    }

    pub async fn state(&self) -> ConnectionState {
        *self.state.lock().await
    }

    pub async fn last_error(&self) -> Option<String> {
        self.last_error.lock().await.clone()
    }

    pub async fn capabilities(&self) -> ServerCapabilities {
        self.capabilities.lock().await.clone()
    }

    async fn require_transport(&self) -> Result<StdioTransport> {
        let g = self.transport.lock().await;
        g.clone().ok_or_else(|| anyhow::anyhow!("MCP client not connected"))
    }

    /// Discover and cache all tools, resources, and prompts from the server.
    pub async fn refresh_capabilities(&self) -> Result<()> {
        let transport = self.require_transport().await?;

        let tools_value = transport
            .request("tools/list", None, self.timeout)
            .await
            .context("tools/list failed")?;
        let tools: McpListToolsResult =
            serde_json::from_value(tools_value).context("Invalid tools/list result")?;
        {
            let mut g = self.capabilities.lock().await;
            g.tools = tools.tools;
        }

        // resources/list and prompts/list are optional. Servers may return
        // MethodNotFound (-32601) if they don't support these capabilities.
        match transport.request("resources/list", None, self.timeout).await {
            Ok(v) => match serde_json::from_value::<McpListResourcesResult>(v) {
                Ok(parsed) => {
                    let mut g = self.capabilities.lock().await;
                    g.resources = parsed.resources;
                }
                Err(e) => eprintln!("[mcp:{}] invalid resources/list payload: {}", self.id, e),
            },
            Err(e) => eprintln!("[mcp:{}] resources/list skipped: {}", self.id, e),
        }
        match transport.request("prompts/list", None, self.timeout).await {
            Ok(v) => match serde_json::from_value::<McpListPromptsResult>(v) {
                Ok(parsed) => {
                    let mut g = self.capabilities.lock().await;
                    g.prompts = parsed.prompts;
                }
                Err(e) => eprintln!("[mcp:{}] invalid prompts/list payload: {}", self.id, e),
            },
            Err(e) => eprintln!("[mcp:{}] prompts/list skipped: {}", self.id, e),
        }

        Ok(())
    }

    pub async fn call_tool(&self, name: &str, arguments: Value) -> Result<McpToolCallResult> {
        let transport = self.require_transport().await?;
        let params = McpToolCallParams {
            name: name.to_string(),
            arguments,
        };
        let v = transport
            .request("tools/call", Some(serde_json::to_value(params)?), self.timeout)
            .await
            .context("tools/call failed")?;
        serde_json::from_value(v).context("Invalid tools/call result")
    }

    pub async fn read_resource(&self, uri: &str) -> Result<Value> {
        let transport = self.require_transport().await?;
        transport
            .request("resources/read", Some(json!({ "uri": uri })), self.timeout)
            .await
            .context("resources/read failed")
    }

    pub async fn get_prompt(
        &self,
        name: &str,
        arguments: Option<HashMap<String, String>>,
    ) -> Result<Value> {
        let transport = self.require_transport().await?;
        let mut params = json!({ "name": name });
        if let Some(args) = arguments {
            params["arguments"] = serde_json::to_value(args)?;
        }
        transport
            .request("prompts/get", Some(params), self.timeout)
            .await
            .context("prompts/get failed")
    }

    pub async fn disconnect(&self) {
        if let Some(t) = self.transport.lock().await.take() {
            t.shutdown().await;
        }
        {
            let mut g = self.capabilities.lock().await;
            g.tools.clear();
            g.resources.clear();
            g.prompts.clear();
        }
        {
            let mut g = self.state.lock().await;
            *g = ConnectionState::Disconnected;
        }
    }
}
