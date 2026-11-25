import test from 'node:test';
import assert from 'node:assert/strict';

process.env.TRUST_PROXY = '1'; // must be set before the gateway loads
const { createGateway } = await import('../server/gateway.js');
const { memoryStore } = await import('../server/services.js');

let base, server;
test.before(async () => { server = createGateway(memoryStore()); await new Promise((r) => server.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => { server.closeAllConnections(); server.close(); });

test('behind a proxy, one busy visitor does not block the others', async () => {
  const hit = (ip) => fetch(base + '/v1/packs', { headers: { 'x-forwarded-for': ip } }).then(async (r) => { await r.arrayBuffer(); return r.status; });
  let last; for (let i = 0; i < 405; i++) last = await hit('203.0.113.5');
  assert.equal(last, 429); assert.equal(await hit('203.0.113.6'), 200);
});
test('a hosted server never reveals its internal addresses', async () => {
  const j = await (await fetch(base + '/v1/health', { headers: { 'x-forwarded-for': '203.0.113.7' } })).json();
  assert.deepEqual(j.lan, []);
});
