// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tauri::Manager;

mod mcp;

use mcp::manager::{ConnectedServer, McpCommandResult, McpManager, ServerStatus, ToolRef};
use mcp::protocol::{McpTool, McpToolCallResult};
use mcp::transport::StdioServerSpec;

static HTTP_CLIENT: std::sync::LazyLock<reqwest::Client> = std::sync::LazyLock::new(|| {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .danger_accept_invalid_certs(true)
        .build()
        .expect("Failed to create HTTP client")
});

// Reusable Tauri state container for the MCP manager.
type McpState = Arc<McpManager>;

#[derive(serde::Deserialize)]
struct ConnectServerArgs {
    id: String,
    command: String,
    args: Vec<String>,
    #[serde(default)]
    env: HashMap<String, String>,
    #[serde(default)]
    cwd: Option<String>,
    #[serde(default)]
    timeout_ms: Option<u64>,
}

#[derive(serde::Deserialize)]
struct CallToolArgs {
    id: String,
    name: String,
    arguments: serde_json::Value,
}

#[derive(serde::Deserialize)]
struct ReadResourceArgs {
    id: String,
    uri: String,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // Install the MCP manager as a managed state.
            app.manage(McpState::new(McpManager::new()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_version,
            open_external_link,
            fetch_ollama,
            mcp_connect_server,
            mcp_disconnect_server,
            mcp_list_servers,
            mcp_server_status,
            mcp_list_tools,
            mcp_aggregate_tools,
            mcp_call_tool,
            mcp_read_resource,
            mcp_check_runtime,
            mcp_shutdown_all
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn fetch_ollama(url: String, method: String, body: Option<String>) -> Result<String, String> {
    println!("[Ollama] Request: {} {}", method, url);

    let request = match method.as_str() {
        "GET" => HTTP_CLIENT.get(&url),
        "POST" => HTTP_CLIENT.post(&url),
        _ => return Err("Unsupported method".to_string()),
    };

    let request = request
        .header("User-Agent", "Mozilla/5.0")
        .header("Accept", "application/json");

    let request = if let Some(b) = body {
        request
            .header("Content-Type", "application/json")
            .body(b)
    } else {
        request
    };

    let response = request.send().await.map_err(|e| {
        println!("[Ollama] Connection error: {}", e);
        e.to_string()
    })?;

    let status = response.status();
    println!("[Ollama] Response status: {}", status);

    if !status.is_success() {
        let text = response.text().await.unwrap_or_default();
        println!("[Ollama] Response body: {}", text);
        return Err(format!("HTTP {} - {}", status, text));
    }

    let text = response.text().await.map_err(|e| e.to_string())?;
    let preview = if text.len() > 200 { &text[..200] } else { &text };
    println!("[Ollama] Response: {}", preview);
    Ok(text)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn open_external_link(url: &str) -> Result<(), String> {
    match open::that(url) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open link: {}", e)),
    }
}

// ============================================================================
// MCP commands
// ============================================================================

#[tauri::command]
async fn mcp_connect_server(
    state: tauri::State<'_, McpState>,
    args: ConnectServerArgs,
) -> Result<McpCommandResult<ConnectedServer>, String> {
    let timeout = args.timeout_ms.map(Duration::from_millis);
    let spec = StdioServerSpec {
        command: args.command,
        args: args.args,
        env: args.env,
        cwd: args.cwd,
    };
    let manager = state.inner().clone();
    let id = args.id.clone();

    let caps = match timeout {
        Some(t) => tokio::time::timeout(t, manager.connect(&id, spec))
            .await
            .map_err(|_| format!("Connection timed out after {:?}", t))?
            .map_err(|e| e.to_string())?,
        None => manager.connect(&id, spec).await.map_err(|e| e.to_string())?,
    };

    let server = ConnectedServer {
        id: id.clone(),
        server_info: caps.server_info,
        tools: caps.tools,
        resources: caps.resources,
        prompts: caps.prompts,
    };
    Ok(McpCommandResult {
        ok: true,
        data: Some(server),
        error: None,
    })
}

#[tauri::command]
async fn mcp_disconnect_server(
    state: tauri::State<'_, McpState>,
    id: String,
) -> Result<(), String> {
    state.inner().clone().disconnect(&id).await;
    Ok(())
}

#[tauri::command]
async fn mcp_list_servers(
    state: tauri::State<'_, McpState>,
) -> Result<Vec<ServerStatus>, String> {
    Ok(state.inner().clone().status_all().await)
}

#[tauri::command]
async fn mcp_server_status(
    state: tauri::State<'_, McpState>,
    id: String,
) -> Result<Option<ServerStatus>, String> {
    Ok(state.inner().clone().status(&id).await)
}

#[tauri::command]
async fn mcp_list_tools(
    state: tauri::State<'_, McpState>,
    id: String,
) -> Result<Vec<McpTool>, String> {
    state
        .inner()
        .clone()
        .list_tools(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn mcp_aggregate_tools(
    state: tauri::State<'_, McpState>,
) -> Result<Vec<ToolRef>, String> {
    Ok(state.inner().clone().aggregate_tools().await)
}

#[tauri::command]
async fn mcp_call_tool(
    state: tauri::State<'_, McpState>,
    args: CallToolArgs,
) -> Result<McpToolCallResult, String> {
    state
        .inner()
        .clone()
        .call_tool(&args.id, &args.name, args.arguments)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn mcp_read_resource(
    state: tauri::State<'_, McpState>,
    args: ReadResourceArgs,
) -> Result<serde_json::Value, String> {
    state
        .inner()
        .clone()
        .read_resource(&args.id, &args.uri)
        .await
        .map_err(|e| e.to_string())
}

#[derive(serde::Serialize, Clone)]
struct RuntimeInfo {
    has_node: bool,
    node_path: Option<String>,
    node_version: Option<String>,
    has_npx: bool,
    npx_path: Option<String>,
    has_uvx: bool,
    uvx_path: Option<String>,
    has_uv: bool,
    uv_path: Option<String>,
    has_python: bool,
    python_path: Option<String>,
    has_docker: bool,
    docker_path: Option<String>,
    platform: String,
}

#[tauri::command]
async fn mcp_check_runtime() -> Result<RuntimeInfo, String> {
    use std::process::Command;
    fn which(cmd: &str) -> Option<String> {
        let out = if cfg!(target_os = "windows") {
            Command::new("where").arg(cmd).output().ok()?
        } else {
            Command::new("which").arg(cmd).output().ok()?
        };
        if out.status.success() {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if s.is_empty() {
                None
            } else {
                Some(s.lines().next().unwrap_or(s.as_str()).to_string())
            }
        } else {
            None
        }
    }
    fn version_of(path: &str) -> Option<String> {
        let out = Command::new(path).arg("--version").output().ok()?;
        if out.status.success() {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            Some(s)
        } else {
            None
        }
    }

    let node_path = which("node");
    let npx_path = which("npx");
    let uvx_path = which("uvx");
    let uv_path = which("uv");
    let python_path = which("python").or_else(|| which("python3"));
    let docker_path = which("docker");

    Ok(RuntimeInfo {
        has_node: node_path.is_some(),
        node_path: node_path.clone(),
        node_version: node_path.as_deref().and_then(version_of),
        has_npx: npx_path.is_some(),
        npx_path: npx_path.clone(),
        has_uvx: uvx_path.is_some(),
        uvx_path: uvx_path.clone(),
        has_uv: uv_path.is_some(),
        uv_path: uv_path.clone(),
        has_python: python_path.is_some(),
        python_path: python_path.clone(),
        has_docker: docker_path.is_some(),
        docker_path: docker_path.clone(),
        platform: std::env::consts::OS.to_string(),
    })
}

#[tauri::command]
async fn mcp_shutdown_all(state: tauri::State<'_, McpState>) -> Result<(), String> {
    state.inner().clone().shutdown_all().await;
    Ok(())
}
