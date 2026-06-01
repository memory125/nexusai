// End-to-end browser simulation: load the Vite-served HTML, extract the
// injected proxy URL, then exercise it like the React app would.

const PAGE = process.env.PAGE_URL || 'http://127.0.0.1:5173/';

async function main() {
  console.log(`Fetching ${PAGE} ...`);
  const html = await fetch(PAGE).then((r) => r.text());
  const m = html.match(/__NEXUSAI_MCP_PROXY_URL__=("([^"]+)")/);
  if (!m) {
    console.log('FAIL: no proxy URL injected in HTML');
    process.exit(1);
  }
  const url = JSON.parse(m[1]);
  console.log('Detected proxy URL:', url);

  const health = await fetch(`${url}/mcp/health`).then((r) => r.json());
  console.log('health:', health);

  console.log('\nConnecting to @modelcontextprotocol/server-everything ...');
  const t0 = Date.now();
  const connect = await fetch(`${url}/mcp/servers/e2e/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-everything'],
      env: {},
    }),
  }).then((r) => r.json());
  console.log(`connect (${Date.now() - t0}ms):`, JSON.stringify(connect, null, 2));

  if (!connect.server) {
    console.log('connect failed');
    return;
  }

  const tools = await fetch(`${url}/mcp/servers/e2e/tools`).then((r) => r.json());
  console.log(`discovered ${tools.length} tools: ${tools.map((t) => t.name).join(', ')}`);

  // Call get-sum which has a simple required schema.
  const sum = await fetch(`${url}/mcp/servers/e2e/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'get-sum', arguments: { a: 3, b: 4 } }),
  }).then((r) => r.json());
  console.log('get-sum(3, 4) result:', JSON.stringify(sum, null, 2));

  await fetch(`${url}/mcp/servers/e2e/disconnect`, { method: 'POST' });
  console.log('disconnected');
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
