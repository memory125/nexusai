// Vite plugin that starts the Node.js MCP proxy alongside the Vite dev server.
// Mirrors the Tauri backend (`src-tauri/src/mcp/`) so the browser can drive
// real MCP servers during `vite dev` (where there is no Tauri shell).
//
// On `vite dev`: starts the proxy on a free port, injects
// `window.__NEXUSAI_MCP_PROXY_URL__` into the HTML, and exposes a small
// introspection endpoint at `/__mcp_proxy`.

import { startMcpProxy } from './mcp-proxy-server.mjs';

export function mcpProxyPlugin(options = {}) {
  const { port = 0 } = options;
  /** @type {{ url: string, port: number, server: any, manager: any } | null} */
  let proxy = null;

  return {
    name: 'nexusai-mcp-proxy',
    apply: 'serve',

    async configureServer(vite) {
      proxy = await startMcpProxy(port);
      vite.config.logger.info(
        `[mcp-proxy] listening on ${proxy.url} (pid=${process.pid})`,
      );

      // Introspection endpoint.
      vite.middlewares.use('/__mcp_proxy', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ url: proxy?.url, port: proxy?.port }));
      });
      vite.middlewares.use('/__mcp_proxy/health', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, url: proxy?.url }));
      });

      // Clean shutdown.
      const stop = () => {
        if (proxy) {
          try {
            proxy.manager.shutdownAll();
          } catch {}
          try {
            proxy.server.close();
          } catch {}
        }
      };
      process.once('SIGINT', stop);
      process.once('SIGTERM', stop);
      vite.httpServer?.once('close', stop);
    },

    /**
     * Inject the proxy URL into the served HTML. Returning an inline
     * `<script>` descriptor with `injectTo: 'head-prepend'` ensures it runs
     * before any module scripts so the React app can read
     * `window.__NEXUSAI_MCP_PROXY_URL__` synchronously.
     */
    transformIndexHtml() {
      if (!proxy) return [];
      const url = JSON.stringify(proxy.url);
      const port = JSON.stringify(proxy.port);
      return [
        {
          tag: 'script',
          attrs: { type: 'text/javascript' },
          children: `window.__NEXUSAI_MCP_PROXY_URL__=${url};window.__NEXUSAI_MCP_PROXY_PORT__=${port};`,
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}
