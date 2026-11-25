import test from 'node:test';
import assert from 'node:assert/strict';
import * as N from '../core/index.js';

const ans = (id, option, side = 'sure', x = {}) => ({ item: N.ITEM[id], option, side, ...x });
const opening = () => [ans('FR-ADD-04', 'D'), ans('FR-CMP-02', 'A'), ans('FR-EQV-07', 'B')];

test('golden vector matches to 1e-9', () => { const g = N.runGolden(); assert.ok(g.pass, 'worst ' + g.worst); });
test('1/2 + 1/3 yields 5/6, 2/5, 2/6, 1/6, each tagged to one cause', () => {
  const o = Object.fromEntries(N.CHECK[0].options.map((x) => [x.label, x.tags[0]]));
  assert.deepEqual(o, { '5/6': 'CORRECT', '2/5': 'TOPS_AND_BOTTOMS', '2/6': 'TOPS_ADD_BOTS_MULT', '1/6': 'MULTIPLY_INSTEAD' });
});
test('2/3 + 1/4 matches the Round 2 slide', () => {
  const { item } = N.makeAdd('x', 2, 3, 1, 4);
  assert.deepEqual(item.options.map((x) => x.label).sort(), ['11/12', '2/12', '3/12', '3/7'].sort());
});
test('rule clashes are rejected', () => assert.equal(N.makeAdd('x', 1, 2, 1, 2).ok, false));
test('every item has four distinct options and one key', () => {
  for (const i of N.ALL_ITEMS) {
    assert.equal(i.options.length, 4, i.id);
    assert.equal(i.options.filter((o) => o.tags.includes('CORRECT')).length, 1);
    assert.equal(new Set(i.options.map((o) => o.label)).size, 4, i.id);
  }
  assert.equal(N.PROBES.length, 18);
});
test('every probe splits at least two causes', () => { for (const p of N.PROBES) assert.ok(new Set(Object.values(p.predict)).size > 1, p.id); });
test('one wrong answer never labels a child', () => {
  const d = N.diagnose(opening());
  assert.ok(d.p > 0.8); assert.equal(d.settled, false);
});
test('two matching answers settle the cause', () => {
  const t = N.ITEM['FR-ADD-10'].predict.TOPS_AND_BOTTOMS;
  assert.equal(N.diagnose([...opening(), ans('FR-ADD-10', t, 'sure', { probe: true })]).label, 'TOPS_AND_BOTTOMS');
});
test('a slip followed by right answers is not flagged as a misconception', () => {
  const d = N.diagnose([...opening(), ...['FR-ADD-10', 'FR-ADD-20'].map((i) => ans(i, N.ITEM[i].answer, 'sure', { probe: true }))]);
  assert.notEqual(d.label, 'TOPS_AND_BOTTOMS');
});
test('information gain is non-negative and ranked', () => {
  const r = N.rankProbes([N.posterior([ans('FR-ADD-04', 'D')])]);
  assert.ok(r[0].bits > 0.1); assert.ok(r.every((x) => x.bits >= 0));
});
test('graph has 15 nodes and no cycles', () => {
  assert.equal(N.CONCEPTS.length, 15);
  for (const c of N.CONCEPTS) assert.ok(!N.downstream(c.id).includes(c.id));
});
test('gap state only moves with fresh evidence', () => {
  assert.equal(N.gapState([]), 'open'); assert.equal(N.gapState([{ ok: true }]), 'closing');
  assert.equal(N.gapState([{ ok: true }, { ok: true }]), 'closed'); assert.equal(N.gapState([{ ok: true }, { ok: false }]), 'open');
});
test('uuidv7 ids are unique and sort by creation', () => {
  const ids = Array.from({ length: 5000 }, () => N.uuidv7());
  assert.equal(new Set(ids).size, 5000); assert.deepEqual([...ids].sort(), ids);
});
test('ingest is idempotent, holds without consent, rejects junk', () => {
  const m = new Map(), store = { has: (k) => m.has(k), add: (e) => m.set(e.eventId, e) };
  const e = [1, 2, 3].map(() => N.makeEvent('L-6B-23', ans('FR-ADD-04', 'D')));
  assert.equal(N.ingest(store, e, () => true).accepted, 3);
  assert.equal(N.ingest(store, [...e, ...e], () => true).duplicates, 6);
  assert.equal(N.ingest(store, [N.makeEvent('L-6B-24', ans('FR-ADD-04', 'D'))], () => false).held, 1);
  assert.equal(N.ingest(store, [{ eventId: 'x', learner: 'Asha' }, null], () => true).rejected, 2);
  assert.equal(m.size, 3);
});
test('a class check is small enough for 2G', () => {
  const e = Array.from({ length: 120 }, () => N.makeEvent('L-6B-23', ans('FR-ADD-04', 'D')));
  const kb = JSON.stringify(e).length / 1024; assert.ok(kb < 30, kb);
});
test('replay reproduces the phone diagnosis whatever the arrival order', () => {
  const a = opening(), ev = a.map((x) => N.makeEvent('L-6B-01', x));
  const r = N.replay(ev.reverse())['L-6B-01'];
  for (const h of N.HYPS) assert.ok(Math.abs(r.post[h] - N.diagnose(a).post[h]) < 1e-12);
});
test('simulation: 100 classes meet the pass bar', (t) => {
  const r = N.emptyReport();
  for (let s = 1; s <= 100; s++) N.addClass(r, N.runClass(s));
  t.diagnostic(`found ${(100 * r.found / r.hiddenGaps).toFixed(1)}% · wrong cause ${(100 * r.wrongCause / r.hiddenGaps).toFixed(1)}% · false flag ${(100 * r.falseFlag / r.secure).toFixed(2)}% · unsure ${(100 * r.unsure / r.learners).toFixed(1)}% · probes ${(r.probes / r.classes).toFixed(1)}`);
  assert.ok(r.found / r.hiddenGaps > 0.75); assert.ok(r.falseFlag / r.secure < 0.02);
});
