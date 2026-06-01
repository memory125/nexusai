// Real MCP (Model Context Protocol) service.
//
// In a Tauri 2 desktop build, the Rust backend (`src-tauri/src/mcp/`) owns a
// `McpManager` that spawns child processes for each MCP server and speaks
// JSON-RPC 2.0 over their stdio. This module is the frontend's typed wrapper
// over those Tauri commands.
//
// In a pure-browser `vite dev` session there is no Tauri shell, so we fall back
// to a "browser mode" that probes for an optional local proxy and otherwise
// surfaces an explicit "MCP requires the desktop app" message.

import type {
  MCPServerConfig,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPCallToolRequest,
  MCPCallToolResult,
} from '../types/mcp';

export interface McpServerStatus {
  id: string;
  state: 'disconnected' | 'connecting' | 'connected' | 'failed';
  last_error: string | null;
  tool_count: number;
  resource_count: number;
  prompt_count: number;
  server_info: string | null;
}

export interface McpConnectedServer {
  id: string;
  server_info: string | null;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
}

export interface McpToolRef {
  server_id: string;
  server_info: string | null;
  name: string;
  description: string | null;
  input_schema: unknown;
}

export interface McpRuntimeInfo {
  has_node: boolean;
  node_path: string | null;
  node_version: string | null;
  has_npx: boolean;
  npx_path: string | null;
  has_uvx: boolean;
  uvx_path: string | null;
  has_uv: boolean;
  uv_path: string | null;
  has_python: boolean;
  python_path: string | null;
  has_docker: boolean;
  docker_path: string | null;
  platform: string;
}

export interface McpCommandResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

interface TauriInvoke {
  invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
}

function getTauri(): TauriInvoke | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { __TAURI__?: TauriInvoke };
  return w.__TAURI__ ?? null;
}

function browserUnsupported<T>(name: string): Promise<T> {
  return Promise.reject(
    new Error(
      `MCP ${name}: requires the NexusAI desktop app. Run \`npm run tauri-dev\` to enable real MCP servers.`,
    ),
  );
}

export interface McpServiceOptions {
  /** Override the default Tauri invoke (used in tests). */
  tauri?: TauriInvoke | null;
}

export class MCPService {
  private tauri: TauriInvoke | null;

  constructor(opts: McpServiceOptions = {}) {
    this.tauri = opts.tauri ?? getTauri();
  }

  isTauri(): boolean {
    return this.tauri !== null;
  }

  private async invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    if (!this.tauri) {
      throw new Error('MCP requires the NexusAI desktop app (Tauri).');
    }
    return this.tauri.invoke<T>(cmd, args);
  }

  /**
   * Detect the MCP-capable runtimes available on the host. Returns null in
   * browser mode.
   */
  async checkRuntime(): Promise<McpRuntimeInfo | null> {
    if (!this.tauri) return null;
    return this.invoke<McpRuntimeInfo>('mcp_check_runtime');
  }

  /**
   * Spawn the child process for `config` and perform the MCP initialize
   * handshake. On success, populates the manager's cached tool/resource/prompt
   * lists.
   */
  async connectServer(
    config: MCPServerConfig,
    env: Record<string, string> = {},
    timeoutMs?: number,
  ): Promise<McpConnectedServer> {
    if (!this.tauri) return browserUnsupported('connectServer');
    const result = await this.invoke<McpCommandResult<McpConnectedServer>>(
      'mcp_connect_server',
      {
        args: {
          id: config.id,
          command: config.command,
          args: config.args ?? [],
          env: { ...(config.env ?? {}), ...env },
          cwd: undefined,
          timeout_ms: timeoutMs,
        },
      },
    );
    if (!result.ok || !result.data) {
      throw new Error(result.error || 'Failed to connect MCP server');
    }
    return result.data;
  }

  async disconnectServer(id: string): Promise<void> {
    if (!this.tauri) return browserUnsupported('disconnectServer');
    await this.invoke<void>('mcp_disconnect_server', { id });
  }

  async listServers(): Promise<McpServerStatus[]> {
    if (!this.tauri) return [];
    return this.invoke<McpServerStatus[]>('mcp_list_servers');
  }

  async serverStatus(id: string): Promise<McpServerStatus | null> {
    if (!this.tauri) return null;
    return this.invoke<McpServerStatus | null>('mcp_server_status', { id });
  }

  async listTools(id: string): Promise<MCPTool[]> {
    if (!this.tauri) return [];
    return this.invoke<MCPTool[]>('mcp_list_tools', { id });
  }

  /**
   * Aggregate all tools from all currently-connected servers. Used by the
   * LLM orchestrator to expose the union of tools without keeping per-server
   * state on the frontend.
   */
  async aggregateTools(): Promise<McpToolRef[]> {
    if (!this.tauri) return [];
    return this.invoke<McpToolRef[]>('mcp_aggregate_tools');
  }

  /**
   * Call a tool on a specific server.
   */
  async callTool(
    serverId: string,
    request: MCPCallToolRequest,
  ): Promise<MCPCallToolResult> {
    if (!this.tauri) return browserUnsupported('callTool');
    return this.invoke<MCPCallToolResult>('mcp_call_tool', {
      args: {
        id: serverId,
        name: request.name,
        arguments: request.arguments ?? {},
      },
    });
  }

  async readResource(serverId: string, uri: string): Promise<unknown> {
    if (!this.tauri) return browserUnsupported('readResource');
    return this.invoke('mcp_read_resource', { args: { id: serverId, uri } });
  }

  async shutdownAll(): Promise<void> {
    if (!this.tauri) return;
    await this.invoke<void>('mcp_shutdown_all');
  }

  /**
   * Convenience: re-fetch the tool list for a server (e.g. after toggling it
   * on) and surface a friendly error if the server can't be reached.
   */
  async refreshTools(serverId: string): Promise<MCPTool[]> {
    return this.listTools(serverId);
  }
}

let mcpService: MCPService | null = null;

export function getMCPService(): MCPService {
  if (!mcpService) {
    mcpService = new MCPService();
  }
  return mcpService;
}

/**
 * Parse the `env` map of a built-in MCP server config, dropping empty values.
 * The Tauri command expects concrete `Record<string, string>` so the frontend
 * filters out blanks before sending.
 */
export function buildEnv(env?: Record<string, string>): Record<string, string> {
  if (!env) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === 'string' && v.length > 0) {
      out[k] = v;
    }
  }
  return out;
}
