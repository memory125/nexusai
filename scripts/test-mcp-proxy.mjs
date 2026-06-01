// Quick MCP round-trip smoke test against a running proxy. Used during
// development to verify the JSON-RPC 2.0 plumbing without bringing up the
// Vite dev server.

const PROXY = process.env.PROXY_URL || 'http://127.0.0.1:14155';

async function main() {
  const health = await fetch(`${PROXY}/mcp/health`).then((r) => r.json());
  console.log('health:', health);

  const runtime = await fetch(`${PROXY}/mcp/runtime`).then((r) => r.json());
  console.log('runtime:', JSON.stringify(runtime, null, 2));

  console.log('\nConnecting to @modelcontextprotocol/server-everything ...');
  const t0 = Date.now();
  const connectRes = await fetch(`${PROXY}/mcp/servers/everything/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-everything'],
      env: {},
    }),
  });
  const connect = await connectRes.json();
  console.log(`connect (${Date.now() - t0}ms):`, JSON.stringify(connect, null, 2));

  if (!connect.server) {
    console.log('connect failed, aborting tool test');
    return;
  }

  const tools = await fetch(`${PROXY}/mcp/servers/everything/tools`).then((r) => r.json());
  console.log('tools:', tools.map((t) => t.name));

  if (tools.length > 0) {
    const t = tools[0];
    const callRes = await fetch(`${PROXY}/mcp/servers/everything/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: t.name, arguments: {} }),
    });
    const call = await callRes.json();
    console.log(`call ${t.name}:`, JSON.stringify(call, null, 2));
  }

  const agg = await fetch(`${PROXY}/mcp/tools`).then((r) => r.json());
  console.log('aggregate tools:', agg.length);

  await fetch(`${PROXY}/mcp/servers/everything/disconnect`, { method: 'POST' });
  console.log('disconnected');
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
