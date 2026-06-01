// Real MCP (Model Context Protocol) service.
//
// Three execution modes are supported and the service is API-compatible across
// all of them so the UI doesn't care which one is active:
//
//  1. Tauri desktop (preferred for production)
//     - Uses `window.__TAURI__.invoke` to call Rust commands in
//       `src-tauri/src/mcp/manager.rs`. The Rust backend spawns MCP child
//       processes and speaks JSON-RPC 2.0 over their stdio.
//  2. Vite dev (browser) with the local MCP proxy
//     - The Vite plugin `scripts/mcp-proxy-plugin.mjs` starts a Node.js HTTP
//       proxy on a free port and injects `window.__NEXUSAI_MCP_PROXY_URL__`.
//       The proxy (`scripts/mcp-proxy-server.mjs`) is a pure-Node.js port of
//       the Rust manager and does the same JSON-RPC 2.0 over stdio.
//  3. Browser without a proxy (e.g. static hosting)
//     - Surface a clear "MCP requires the desktop app or dev proxy" error.

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

type Transport = 'tauri' | 'proxy' | 'none';

function detectTauri(): TauriInvoke | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { __TAURI__?: TauriInvoke };
  return w.__TAURI__ ?? null;
}

function detectProxyUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { __NEXUSAI_MCP_PROXY_URL__?: string };
  return w.__NEXUSAI_MCP_PROXY_URL__ ?? null;
}

export interface McpServiceOptions {
  tauri?: TauriInvoke | null;
  proxyUrl?: string | null;
}

export class MCPService {
  private tauri: TauriInvoke | null;
  private proxyUrl: string | null;
  private transport: Transport;

  constructor(opts: McpServiceOptions = {}) {
    this.tauri = opts.tauri ?? detectTauri();
    this.proxyUrl = opts.proxyUrl ?? detectProxyUrl();
    this.transport = this.tauri ? 'tauri' : this.proxyUrl ? 'proxy' : 'none';
  }

  /** Returns the active transport. */
  getTransport(): Transport {
    return this.transport;
  }

  /** True when we can actually call real MCP servers. */
  isAvailable(): boolean {
    return this.transport !== 'none';
  }

  /** True when running inside the Tauri desktop shell. */
  isTauri(): boolean {
    return this.transport === 'tauri';
  }

  /** True when the Vite dev proxy is wired up. */
  isProxy(): boolean {
    return this.transport === 'proxy';
  }

  private async tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    if (!this.tauri) {
      throw new Error('Tauri runtime not available.');
    }
    return this.tauri.invoke<T>(cmd, args);
  }

  private async proxyFetch<T>(path: string, init?: RequestInit): Promise<T> {
    if (!this.proxyUrl) {
      throw new Error('MCP proxy not available. Start `npm run dev` to enable it.');
    }
    const res = await fetch(this.proxyUrl + path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      let err: string;
      try {
        err = JSON.parse(text).error || text;
      } catch {
        err = text || `HTTP ${res.status}`;
      }
      throw new Error(err);
    }
    return (await res.json()) as T;
  }

  async checkRuntime(): Promise<McpRuntimeInfo | null> {
    if (this.transport === 'tauri') {
      return this.tauriInvoke<McpRuntimeInfo>('mcp_check_runtime');
    }
    if (this.transport === 'proxy') {
      return this.proxyFetch<McpRuntimeInfo>('/mcp/runtime');
    }
    return null;
  }

  async connectServer(
    config: MCPServerConfig,
    env: Record<string, string> = {},
    timeoutMs?: number,
  ): Promise<McpConnectedServer> {
    const finalEnv = { ...(config.env ?? {}), ...env };

    if (this.transport === 'tauri') {
      const result = await this.tauriInvoke<McpCommandResult<McpConnectedServer>>(
        'mcp_connect_server',
        {
          args: {
            id: config.id,
            command: config.command,
            args: config.args ?? [],
            env: finalEnv,
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

    if (this.transport === 'proxy') {
      const response = await this.proxyFetch<{ server: McpConnectedServer }>(
        `/mcp/servers/${encodeURIComponent(config.id)}/connect`,
        {
          method: 'POST',
          body: JSON.stringify({
            command: config.command,
            args: config.args ?? [],
            env: finalEnv,
          }),
        },
      );
      return response.server;
    }

    throw new Error(
      'MCP requires either the NexusAI desktop app or `npm run dev` with the local MCP proxy.',
    );
  }

  async disconnectServer(id: string): Promise<void> {
    if (this.transport === 'tauri') {
      await this.tauriInvoke<void>('mcp_disconnect_server', { id });
      return;
    }
    if (this.transport === 'proxy') {
      await this.proxyFetch<{ ok: true }>(
        `/mcp/servers/${encodeURIComponent(id)}/disconnect`,
        { method: 'POST' },
      );
      return;
    }
  }

  async listServers(): Promise<McpServerStatus[]> {
    if (this.transport === 'tauri') {
      return this.tauriInvoke<McpServerStatus[]>('mcp_list_servers');
    }
    if (this.transport === 'proxy') {
      return this.proxyFetch<McpServerStatus[]>('/mcp/servers');
    }
    return [];
  }

  async serverStatus(id: string): Promise<McpServerStatus | null> {
    if (this.transport === 'tauri') {
      return this.tauriInvoke<McpServerStatus | null>('mcp_server_status', { id });
    }
    if (this.transport === 'proxy') {
      return this.proxyFetch<McpServerStatus | null>(`/mcp/servers/${encodeURIComponent(id)}`);
    }
    return null;
  }

  async listTools(id: string): Promise<MCPTool[]> {
    if (this.transport === 'tauri') {
      return this.tauriInvoke<MCPTool[]>('mcp_list_tools', { id });
    }
    if (this.transport === 'proxy') {
      return this.proxyFetch<MCPTool[]>(`/mcp/servers/${encodeURIComponent(id)}/tools`);
    }
    return [];
  }

  async aggregateTools(): Promise<McpToolRef[]> {
    if (this.transport === 'tauri') {
      return this.tauriInvoke<McpToolRef[]>('mcp_aggregate_tools');
    }
    if (this.transport === 'proxy') {
      return this.proxyFetch<McpToolRef[]>('/mcp/tools');
    }
    return [];
  }

  async callTool(
    serverId: string,
    request: MCPCallToolRequest,
  ): Promise<MCPCallToolResult> {
    if (this.transport === 'tauri') {
      return this.tauriInvoke<MCPCallToolResult>('mcp_call_tool', {
        args: {
          id: serverId,
          name: request.name,
          arguments: request.arguments ?? {},
        },
      });
    }
    if (this.transport === 'proxy') {
      return this.proxyFetch<MCPCallToolResult>(
        `/mcp/servers/${encodeURIComponent(serverId)}/call`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: request.name,
            arguments: request.arguments ?? {},
          }),
        },
      );
    }
    throw new Error('MCP transport unavailable.');
  }

  async readResource(serverId: string, uri: string): Promise<unknown> {
    if (this.transport === 'tauri') {
      return this.tauriInvoke('mcp_read_resource', { args: { id: serverId, uri } });
    }
    if (this.transport === 'proxy') {
      return this.proxyFetch(
        `/mcp/servers/${encodeURIComponent(serverId)}/resources/read`,
        { method: 'POST', body: JSON.stringify({ uri }) },
      );
    }
    throw new Error('MCP transport unavailable.');
  }

  async shutdownAll(): Promise<void> {
    if (this.transport === 'tauri') {
      await this.tauriInvoke<void>('mcp_shutdown_all');
      return;
    }
    if (this.transport === 'proxy') {
      await this.proxyFetch<{ ok: true }>('/mcp/shutdown', { method: 'POST' });
    }
  }

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
 * The transport layer expects concrete `Record<string, string>` so the
 * frontend filters out blanks before sending.
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
