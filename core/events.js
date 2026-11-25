// neev-core / events: immutable answers, idempotent by eventId, replayed by the server.
import { ENGINE, PACK } from './rules.js';
import { ITEM } from './items.js';
import { diagnose } from './bayes.js';

let lastT = 0, seq = 0;
/** UUIDv7. A 12-bit counter keeps ids sortable inside one millisecond. */
export function uuidv7(now = Date.now()) {
  if (now <= lastT) { seq++; if (seq > 0xfff) { lastT++; seq = 0; } now = lastT; } else { lastT = now; seq = 0; }
  const b = crypto.getRandomValues(new Uint8Array(16));
  for (let i = 5, t = now; i >= 0; i--) { b[i] = t % 256; t = Math.floor(t / 256); }
  b[6] = 0x70 | (seq >> 8); b[7] = seq & 0xff; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
function iso() {
  const d = new Date(), z = -d.getTimezoneOffset(), p = (n) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  return new Date(d.getTime() + z * 60000).toISOString().slice(0, 19) + (z < 0 ? '-' : '+') + p(z / 60) + ':' + p(z % 60);
}
export const makeEvent = (learner, ans) => ({
  eventId: uuidv7(), learner, item: ans.item.id, option: ans.option, side: ans.side,
  ...(ans.probe ? { probe: true, informative: ans.informative !== false } : {}), ts: iso(), engine: ENGINE, pack: PACK,
});

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function validEvent(e) {
  return !!e && ID.test(e.eventId) && /^L-[0-9A-Z]{1,4}-\d{2}$/.test(e.learner) && Object.hasOwn(ITEM, e.item)
    && ['A', 'B', 'C', 'D'].includes(e.option) && ['sure', 'guess'].includes(e.side) && typeof e.ts === 'string' && e.ts.length < 40;
}
/** Same engine, same events, same answer: phone state is only a cache of this. */
export function replay(events) {
  const by = {};
  for (const e of [...events].sort((a, b) => (a.eventId < b.eventId ? -1 : 1)))
    (by[e.learner] ??= []).push({ item: ITEM[e.item], option: e.option, side: e.side, probe: e.probe, informative: e.informative });
  return Object.fromEntries(Object.entries(by).map(([l, a]) => [l, { answers: a, ...diagnose(a) }]));
}
/** Idempotent ingest used by both the Node API and the in-browser demo cloud. */
export function ingest(store, batch, consentOk) {
  const out = { accepted: 0, duplicates: 0, held: 0, rejected: 0, acked: [] };
  for (const e of batch) {
    if (!validEvent(e)) { out.rejected++; continue; }
    if (!consentOk(e.learner)) { out.held++; continue; }
    if (store.has(e.eventId)) { out.duplicates++; out.acked.push(e.eventId); continue; }
    store.add(e); out.accepted++; out.acked.push(e.eventId);
  }
  return out;
}
