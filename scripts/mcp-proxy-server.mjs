// Node.js MCP proxy server.
// Speaks JSON-RPC 2.0 over stdio with MCP server child processes, mirroring
// the Tauri backend (`src-tauri/src/mcp/`). Exposed as a tiny HTTP surface so
// the browser can drive real MCP servers during `vite dev` (where there is no
// Tauri shell).
//
// Endpoints (all JSON):
//   GET  /mcp/runtime                     - probe npx/uvx/node/python/docker
//   GET  /mcp/servers                     - list servers with status
//   GET  /mcp/servers/:id                 - single server status
//   POST /mcp/servers/:id/connect         - spawn + initialize
//   POST /mcp/servers/:id/disconnect      - kill
//   GET  /mcp/servers/:id/tools           - cached tools
//   POST /mcp/servers/:id/call            - call a tool { name, arguments }
//   GET  /mcp/servers/:id/resources       - cached resources
//   POST /mcp/servers/:id/resources/read  - read resource { uri }
//   GET  /mcp/servers/:id/prompts         - cached prompts
//   POST /mcp/servers/:id/prompts/get     - get prompt { name, arguments? }
//   GET  /mcp/tools                       - aggregate tools across servers
//   POST /mcp/shutdown                    - shutdown all
//   GET  /mcp/health                      - liveness probe

import http from 'node:http';
import { spawn } from 'node:child_process';
import { URL } from 'node:url';

const PROTOCOL_VERSION = '2024-11-05';
const CLIENT_INFO = { name: 'NexusAI-Web', version: '1.0.0' };

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 over stdio
// ---------------------------------------------------------------------------

/**
 * StdioTransport: spawns a child process and provides newline-delimited
 * JSON-RPC 2.0 over its stdin/stdout.
 */
class StdioTransport {
  constructor({ command, args = [], env = {}, cwd = null, onStderr = null }) {
    this.command = command;
    this.args = args;
    this.env = env;
    this.cwd = cwd;
    this.proc = null;
    this.writeStream = null;
    this.buf = '';
    this.nextId = 1;
    this.pending = new Map(); // id -> { resolve, reject, timer }
    this.serverInfo = null;
    this.protocolVersion = null;
    this.tools = [];
    this.resources = [];
    this.prompts = [];
    this.lastError = null;
    this.connected = false;
    this.onStderr = onStderr;
  }

  spawn() {
    return new Promise((resolve, reject) => {
      // On Windows, executable lookup honors `PATHEXT`. We use Node's
      // `child_process.spawn` directly which will resolve `npx` -> `npx.cmd`
      // automatically. But because Node 20+ refuses to spawn a `.cmd`/`.bat`
      // file without `shell: true`, we opt into the shell when the command
      // is a known shim (npx, yarn, pnpm, bun, deno, uv, uvx) or when
      // resolution looks ambiguous. The arguments are user-provided
      // (locally installed package names) so this is acceptable.
      const isWindows = process.platform === 'win32';
      const shim = isWindows && /^(npx|npm|yarn|pnpm|bun|deno|uvx|uv|tsx|ts-node)(\.cmd)?$/i.test(this.command);
      const opts = {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...this.env },
        cwd: this.cwd || undefined,
        windowsHide: true,
      };
      if (isWindows) {
        if (shim) opts.shell = true;
      }
      try {
        this.proc = spawn(this.command, this.args, opts);
      } catch (err) {
        reject(new Error(`Failed to spawn ${this.command}: ${err.message}`));
        return;
      }
      this.writeStream = this.proc.stdin;

      this.proc.stdout.setEncoding('utf8');
      this.proc.stdout.on('data', (chunk) => this._onStdout(chunk));

      this.proc.stderr.setEncoding('utf8');
      this.proc.stderr.on('data', (chunk) => {
        if (this.onStderr) this.onStderr(chunk);
        else process.stderr.write(`[mcp-server:${this.command}] ${chunk}`);
      });

      this.proc.on('error', (err) => {
        this.lastError = err.message;
        this._failAllPending(err);
      });

      this.proc.on('close', (code, signal) => {
        this.connected = false;
        this._failAllPending(
          new Error(`Process exited (code=${code}, signal=${signal})`),
        );
      });

      // Give the process a moment to start, then resolve.
      setTimeout(() => resolve(), 50);
    });
  }

  _onStdout(chunk) {
    this.buf += chunk;
    let nl;
    while ((nl = this.buf.indexOf('\n')) >= 0) {
      const line = this.buf.slice(0, nl).trim();
      this.buf = this.buf.slice(nl + 1);
      if (!line) continue;
      this._dispatch(line);
    }
  }

  _dispatch(line) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch (err) {
      process.stderr.write(`[mcp-proxy] bad json: ${line}\n`);
      return;
    }
    if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      this.pending.delete(msg.id);
      clearTimeout(entry.timer);
      if (msg.error) {
        entry.reject(new Error(`MCP error (${msg.error.code}): ${msg.error.message}`));
      } else {
        entry.resolve(msg.result ?? null);
      }
      return;
    }
    // Notifications (no id) are not expected from servers; ignore.
  }

  _failAllPending(err) {
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(err);
    }
    this.pending.clear();
  }

  request(method, params, timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      // Some MCP servers reject requests when params is `null` (they expect
      // either an object or to be absent). We default to `{}` for safety.
      const payload = { jsonrpc: '2.0', id, method, params: params ?? {} };
      const line = JSON.stringify(payload) + '\n';
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.writeStream.write(line);
      } catch (err) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(new Error(`Write failed: ${err.message}`));
      }
    });
  }

  notify(method, params) {
    // Per JSON-RPC 2.0, a notification omits the `id` field. The server is
    // not expected to respond, and a stray id would confuse the router.
    const line = JSON.stringify({ jsonrpc: '2.0', method, params: params ?? {} }) + '\n';
    try {
      this.writeStream.write(line);
    } catch (err) {
      throw new Error(`Write failed: ${err.message}`);
    }
  }

  async initialize() {
    const result = await this.request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: CLIENT_INFO,
    }, 120000);
    this.serverInfo = result?.serverInfo ?? null;
    this.protocolVersion = result?.protocolVersion ?? null;
    // Complete the handshake with notifications/initialized.
    this.notify('notifications/initialized', {});
    this.connected = true;
    return result;
  }

  async refreshCapabilities() {
    try {
      const tools = await this.request('tools/list', null, 120000);
      this.tools = tools?.tools ?? [];
    } catch (err) {
      process.stderr.write(`[mcp-proxy] tools/list failed: ${err.message}\n`);
    }
    try {
      const resources = await this.request('resources/list', null, 60000);
      this.resources = resources?.resources ?? [];
    } catch (err) {
      // Method not found or server doesn't support resources — ignore.
    }
    try {
      const prompts = await this.request('prompts/list', null, 60000);
      this.prompts = prompts?.prompts ?? [];
    } catch (err) {
      // Same.
    }
  }

  kill() {
    if (this.proc && !this.proc.killed) {
      try {
        this.proc.kill();
      } catch {}
    }
    this.connected = false;
  }
}

// ---------------------------------------------------------------------------
// Server manager (mirrors McpManager in src-tauri/src/mcp/manager.rs)
// ---------------------------------------------------------------------------

class McpManager {
  constructor() {
    /** @type {Map<string, { id: string, transport: StdioTransport, connectedAt: number }>} */
    this.servers = new Map();
  }

  async connect(id, command, args, env) {
    if (this.servers.has(id)) {
      const existing = this.servers.get(id);
      if (existing.transport.connected) {
        return { server: this.snapshot(id) };
      }
      // Drop the dead one first.
      existing.transport.kill();
      this.servers.delete(id);
    }
    const transport = new StdioTransport({ command, args, env });
    try {
      await transport.spawn();
      await transport.initialize();
      await transport.refreshCapabilities();
    } catch (err) {
      transport.kill();
      throw err;
    }
    this.servers.set(id, { id, transport, connectedAt: Date.now() });
    return { server: this.snapshot(id) };
  }

  disconnect(id) {
    const s = this.servers.get(id);
    if (s) {
      s.transport.kill();
      this.servers.delete(id);
    }
  }

  snapshot(id) {
    const s = this.servers.get(id);
    if (!s) {
      return {
        id,
        state: 'disconnected',
        last_error: null,
        tool_count: 0,
        resource_count: 0,
        prompt_count: 0,
        server_info: null,
        tools: [],
        resources: [],
        prompts: [],
      };
    }
    const t = s.transport;
    return {
      id,
      state: t.connected ? 'connected' : 'failed',
      last_error: t.lastError,
      tool_count: t.tools.length,
      resource_count: t.resources.length,
      prompt_count: t.prompts.length,
      server_info: t.serverInfo
        ? `${t.serverInfo.name} v${t.serverInfo.version} (protocol ${t.protocolVersion})`
        : null,
      tools: t.tools,
      resources: t.resources,
      prompts: t.prompts,
    };
  }

  listServers() {
    return Array.from(this.servers.keys()).map((id) => this.snapshot(id));
  }

  listTools(id) {
    const s = this.servers.get(id);
    if (!s) return [];
    return s.transport.tools;
  }

  aggregateTools() {
    const out = [];
    for (const [, s] of this.servers) {
      if (!s.transport.connected) continue;
      const info = s.transport.serverInfo
        ? `${s.transport.serverInfo.name} v${s.transport.serverInfo.version}`
        : null;
      for (const t of s.transport.tools) {
        out.push({
          server_id: s.id,
          server_info: info,
          name: t.name,
          description: t.description ?? null,
          input_schema: t.inputSchema,
        });
      }
    }
    return out;
  }

  async callTool(id, name, args) {
    const s = this.servers.get(id);
    if (!s) throw new Error(`Unknown MCP server: ${id}`);
    const params = { name, arguments: args ?? {} };
    const result = await s.transport.request('tools/call', params);
    return result;
  }

  async readResource(id, uri) {
    const s = this.servers.get(id);
    if (!s) throw new Error(`Unknown MCP server: ${id}`);
    return await s.transport.request('resources/read', { uri });
  }

  async getPrompt(id, name, args) {
    const s = this.servers.get(id);
    if (!s) throw new Error(`Unknown MCP server: ${id}`);
    return await s.transport.request('prompts/get', { name, arguments: args });
  }

  shutdownAll() {
    for (const [, s] of this.servers) {
      s.transport.kill();
    }
    this.servers.clear();
  }
}

// ---------------------------------------------------------------------------
// Runtime detection
// ---------------------------------------------------------------------------

async function which(cmd) {
  const isWindows = process.platform === 'win32';
  const probe = isWindows ? 'where' : 'which';
  return new Promise((resolve) => {
    const proc = spawn(probe, [cmd], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let out = '';
    proc.stdout.on('data', (c) => (out += c.toString()));
    proc.on('error', () => resolve(null));
    proc.on('close', (code) => {
      if (code !== 0) return resolve(null);
      const first = out.split(/\r?\n/).find((l) => l.trim());
      resolve(first ? first.trim() : null);
    });
  });
}

async function versionOf(path) {
  if (!path) return null;
  return new Promise((resolve) => {
    const proc = spawn(path, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let out = '';
    proc.stdout.on('data', (c) => (out += c.toString()));
    proc.on('error', () => resolve(null));
    proc.on('close', () => {
      const v = out.split(/\r?\n/)[0]?.trim();
      resolve(v || null);
    });
  });
}

async function detectRuntime() {
  const [node_path, npx_path, uvx_path, uv_path, python_path, docker_path] = await Promise.all([
    which('node'),
    which('npx'),
    which('uvx'),
    which('uv'),
    which(process.platform === 'win32' ? 'python' : 'python3').then((p) => p || which('python')),
    which('docker'),
  ]);
  const node_version = await versionOf(node_path);
  return {
    has_node: !!node_path,
    node_path,
    node_version,
    has_npx: !!npx_path,
    npx_path,
    has_uvx: !!uvx_path,
    uvx_path,
    has_uv: !!uv_path,
    uv_path,
    has_python: !!python_path,
    python_path,
    has_docker: !!docker_path,
    docker_path,
    platform: process.platform,
  };
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

function jsonResponse(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('error', reject);
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error(`Invalid JSON: ${err.message}`));
      }
    });
  });
}

async function handle(req, res, manager, ctx) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    res.end();
    return;
  }

  try {
    if (method === 'GET' && pathname === '/mcp/health') {
      return jsonResponse(res, 200, { ok: true, pid: process.pid, port: ctx.port });
    }
    if (method === 'GET' && pathname === '/mcp/runtime') {
      return jsonResponse(res, 200, await detectRuntime());
    }
    if (method === 'GET' && pathname === '/mcp/servers') {
      return jsonResponse(res, 200, manager.listServers());
    }
    if (method === 'GET' && pathname === '/mcp/tools') {
      return jsonResponse(res, 200, manager.aggregateTools());
    }
    if (method === 'POST' && pathname === '/mcp/shutdown') {
      manager.shutdownAll();
      return jsonResponse(res, 200, { ok: true });
    }

    // Per-server routes
    const perServer = pathname.match(/^\/mcp\/servers\/([^\/]+)(?:\/(.+))?$/);
    if (perServer) {
      const id = decodeURIComponent(perServer[1]);
      const sub = perServer[2] || '';

      if (method === 'GET' && sub === '') {
        return jsonResponse(res, 200, manager.snapshot(id));
      }
      if (method === 'POST' && sub === 'connect') {
        const body = await readBody(req);
        const result = await manager.connect(
          id,
          body.command,
          body.args || [],
          body.env || {},
        );
        return jsonResponse(res, 200, result);
      }
      if (method === 'POST' && sub === 'disconnect') {
        manager.disconnect(id);
        return jsonResponse(res, 200, { ok: true });
      }
      if (method === 'GET' && sub === 'tools') {
        return jsonResponse(res, 200, manager.listTools(id));
      }
      if (method === 'POST' && sub === 'call') {
        const body = await readBody(req);
        const result = await manager.callTool(id, body.name, body.arguments);
        return jsonResponse(res, 200, result);
      }
      if (method === 'GET' && sub === 'resources') {
        const snap = manager.snapshot(id);
        return jsonResponse(res, 200, snap.resources || []);
      }
      if (method === 'POST' && sub === 'resources/read') {
        const body = await readBody(req);
        const result = await manager.readResource(id, body.uri);
        return jsonResponse(res, 200, result);
      }
      if (method === 'GET' && sub === 'prompts') {
        const snap = manager.snapshot(id);
        return jsonResponse(res, 200, snap.prompts || []);
      }
      if (method === 'POST' && sub === 'prompts/get') {
        const body = await readBody(req);
        const result = await manager.getPrompt(id, body.name, body.arguments);
        return jsonResponse(res, 200, result);
      }
    }

    return jsonResponse(res, 404, { error: `Not found: ${method} ${pathname}` });
  } catch (err) {
    return jsonResponse(res, 500, { error: err.message || String(err) });
  }
}

export async function startMcpProxy(port = 0) {
  const manager = new McpManager();
  const server = http.createServer((req, res) => handle(req, res, manager, { port }));
  await new Promise((resolve) => {
    server.listen(port, '127.0.0.1', resolve);
  });
  const addr = server.address();
  const actualPort = typeof addr === 'object' && addr ? addr.port : port;
  const url = `http://127.0.0.1:${actualPort}`;
  return { url, port: actualPort, server, manager };
}

// Allow running standalone for debugging: `node scripts/mcp-proxy-server.mjs`.
const isMain = (() => {
  try {
    const argvPath = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : '';
    const modulePath = new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
    return modulePath === argvPath || import.meta.url.endsWith(process.argv[1] ?? '');
  } catch {
    return false;
  }
})();
if (isMain) {
  startMcpProxy(0).then(({ url, port }) => {
    console.log(`[mcp-proxy] listening on ${url}`);
  });
}
