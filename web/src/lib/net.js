// Talks to the Node gateway when it is there; otherwise runs the very same services inside the page.
import { signal } from '@preact/signals';
import { createServices, memoryStore } from '../../../server/services.js';

export const server = signal('checking'); // live | demo
export const lanUrl = signal(null);
const tokens = {};
let local = createServices(memoryStore());
export const resetLocal = () => { local = createServices(memoryStore()); };

export async function probe(again = true) {
  try {
    const r = await fetch('/v1/health', { signal: AbortSignal.timeout(2500) });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) throw 0;
    const j = await r.json(); server.value = 'live';
    if (/^(localhost|127\.)/.test(location.hostname) && j.lan?.[0]) lanUrl.value = `http://${j.lan[0]}:${location.port || j.port}`;
  } catch { server.value = 'demo'; if (again) setTimeout(() => probe(false), 4000); }
}
export const shareUrl = (hash = '') => (lanUrl.value || location.origin) + location.pathname + hash;

export async function call(path, { role, body } = {}) {
  const h = { 'content-type': 'application/json' };
  if (role) {
    if (!tokens[role] || tokens[role].t < Date.now()) { const r = await fetch('/v1/auth/demo', { method: 'POST', headers: h, body: JSON.stringify({ role }) }); tokens[role] = { v: (await r.json()).token, t: Date.now() + 12 * 60e3 }; }
    h.authorization = 'Bearer ' + tokens[role].v;
  }
  const r = await fetch('/v1' + path, { method: body ? 'POST' : 'GET', headers: h, body: body && JSON.stringify(body) });
  const j = await r.json(); if (!r.ok) throw Object.assign(new Error(j.error), { status: r.status });
  return j;
}
export async function upload(events, check) {
  if (server.value === 'live') return call('/events', { role: 'teacher', body: { events, check } });
  await new Promise((r) => setTimeout(r, 250));
  return { ...local.sync.upload(events, check), total: local.sync.count() };
}
export async function serverReplay(section, check) {
  if (server.value === 'live') return call(`/sections/${section}/replay?check=${check}`, { role: 'teacher' });
  return local.diagnosis.replay(section, check);
}
export async function serverGolden() { return server.value === 'live' ? call('/engine/golden') : local.diagnosis.golden(); }
