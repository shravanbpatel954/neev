import test from 'node:test';
import assert from 'node:assert/strict';
import { createGateway } from '../server/gateway.js';
import { memoryStore } from '../server/services.js';
import { CHECK, diagnose, makeEvent } from '../core/index.js';

let base, server;
test.before(async () => { server = createGateway(memoryStore()); await new Promise((r) => server.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${server.address().port}/v1`; });
test.after(() => { server.closeAllConnections(); server.close(); });
const call = async (p, { token, body, method } = {}) => { const r = await fetch(base + p, { method: method || (body ? 'POST' : 'GET'), headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body && JSON.stringify(body) }); return { status: r.status, json: await r.json() }; };
const login = async (role) => (await call('/auth/demo', { body: { role } })).json.token;

test('golden vector passes on the server target', async () => assert.equal((await call('/engine/golden')).json.pass, true));
test('roles are enforced and tokens cannot be forged', async () => {
  assert.equal((await call('/events', { body: { events: [] } })).status, 401);
  assert.equal((await call('/events', { token: await login('leader'), body: { events: [] } })).status, 403);
  const t = await login('leader'); assert.equal((await call('/events', { token: t.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')) + 'x', body: { events: [] } })).status, 401);
});
test('broken network: dropped and repeated uploads lose and double nothing', async () => {
  const token = await login('teacher'), answers = CHECK.map((item) => ({ item, option: item.predict.TOPS_AND_BOTTOMS, side: 'sure' })), ev = answers.map((a) => makeEvent('L-6B-05', a));
  let accepted = 0; for (let i = 0; i < 6; i++) accepted += (await call('/events', { token, body: { events: i % 2 ? ev : ev.slice(0, 2) } })).json.accepted;
  assert.equal(accepted, 3);
  const r = (await call('/sections/6B/replay', { token })).json['L-6B-05'], d = diagnose(answers);
  for (const h in d.post) assert.ok(Math.abs(r.post[h] - d.post[h]) < 1e-12);
});
test('learner without consent is held', async () => { const token = await login('teacher'); assert.equal((await call('/events', { token, body: { events: [makeEvent('L-6B-17', { item: CHECK[0], option: 'A', side: 'sure' })] } })).json.held, 1); });
test('content check catches rule clashes and junk', async () => {
  const token = await login('content');
  assert.equal((await call('/content/check', { token, body: { p: [1, 2, 1, 2] } })).json.ok, false);
  assert.equal((await call('/content/check', { token, body: { p: [2, 3, 1, 4] } })).json.ok, true);
  assert.equal((await call('/content/check', { token, body: { p: ['x'] } })).json.ok, false);
});
test('live room: join, answer once, host only controls', async () => {
  const { code, host } = (await call('/rooms', { body: {} })).json, { player } = (await call(`/rooms/${code}/join`, { body: { name: '<b>Juror</b>' } })).json;
  assert.equal((await call(`/rooms/${code}/answer`, { body: { player, option: 'D', side: 'sure' } })).status, 200);
  await call(`/rooms/${code}/answer`, { body: { player, option: 'A', side: 'sure' } });
  assert.equal((await call(`/rooms/${code}/host`, { body: { host: 'no', reveal: true } })).status, 403);
  const c = new AbortController(), s = await fetch(`${base}/rooms/${code}/live`, { signal: c.signal }), chunk = new TextDecoder().decode((await s.body.getReader().read()).value); c.abort();
  const st = JSON.parse(chunk.slice(6)); assert.equal(st.players[0].name, 'bJurorb'); assert.deepEqual(st.players[0].answers, [{ item: 'FR-ADD-04', option: 'D', side: 'sure' }]);
  assert.equal((await call(`/rooms/${code}/host`, { body: { host, item: 'FR-ADD-10' } })).status, 200);
});
test('path traversal is refused', async () => { const r = await fetch(base.replace('/v1', '') + '/..%2f..%2fpackage.json'); assert.ok(!(await r.text()).includes('"neev"')); });
