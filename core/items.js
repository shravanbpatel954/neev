// neev-core / items: questions are computed from rules, so every option is tagged for free.
import { ADD_RULES, HYPS, eqFrac, fracText } from './rules.js';

const L = ['A', 'B', 'C', 'D'];
const seedOf = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
export function rng(seed) { // mulberry32
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function arrange(id, opts, order) {
  const list = order ? order.map((i) => opts[i]) : shuffle(opts, rng(seedOf(id)));
  return list.map((o, i) => ({ ...o, key: L[i] }));
}
function finish(item) { // predicted option letter for every hypothesis
  item.answer = item.options.find((o) => o.tags.includes('CORRECT')).key;
  item.predict = Object.fromEntries(HYPS.map((h) => [h, item.options.find((o) => o.tags.includes(h))?.key ?? item.answer]));
  return item;
}

/** Returns {ok,item} or {ok:false,clash:[rule,rule,value]} when two rules agree. */
export function makeAdd(id, a, b, c, d, order) {
  const opts = Object.entries(ADD_RULES).map(([h, f]) => ({ val: f(a, b, c, d), tags: [h] }));
  for (let i = 0; i < opts.length; i++) for (let j = i + 1; j < opts.length; j++)
    if (eqFrac(opts[i].val, opts[j].val)) return { ok: false, clash: [opts[i].tags[0], opts[j].tags[0], fracText(opts[i].val)] };
  const item = { id, type: 'ADD', concept: b === d ? 'addlike' : 'addunlike', p: [a, b, c, d], text: `${a}/${b} + ${c}/${d} = ?`, options: arrange(id, opts.map((o) => ({ ...o, label: fracText(o.val) })), order) };
  return { ok: true, item: finish(item) };
}
export function makeCmp(id, a, b, c, d) {
  const l = a * d, r = c * b;
  if (l === r) return { ok: false, clash: ['CORRECT', 'BIGGER_BOTTOM_BIGGER', 'equal'] };
  const bbbLeft = b > d, okLeft = l > r;
  if (bbbLeft === okLeft) return { ok: false, clash: ['CORRECT', 'BIGGER_BOTTOM_BIGGER', 'same choice'] };
  const opts = [
    { val: [a, b], label: `${a}/${b}`, tags: okLeft ? ['CORRECT'] : ['BIGGER_BOTTOM_BIGGER'] },
    { val: [c, d], label: `${c}/${d}`, tags: okLeft ? ['BIGGER_BOTTOM_BIGGER'] : ['CORRECT'] },
    { label: 'same', word: 'same', tags: [] },
    { label: 'cannot tell', word: 'cannot', tags: [] },
  ];
  return { ok: true, item: finish({ id, type: 'CMP', concept: 'size', p: [a, b, c, d], text: `Which is bigger, ${a}/${b} or ${c}/${d}?`, options: arrange(id, opts, [0, 1, 2, 3]) }) };
}
export function makeEqv(id, a, b, d, order) {
  const ok = (a * d) / b, add = a + d - b;
  if (ok === add) return { ok: false, clash: ['CORRECT', 'ADDITIVE_EQUIV', String(ok)] };
  const extra = [];
  for (const v of [a, ok + 1, ok - 1, add + 1, d - 1]) if (v > 0 && v !== ok && v !== add && !extra.includes(v) && extra.length < 2) extra.push(v);
  const opts = [{ label: String(ok), num: ok, tags: ['CORRECT'] }, { label: String(add), num: add, tags: ['ADDITIVE_EQUIV'] }, ...extra.map((v) => ({ label: String(v), num: v, tags: [] }))];
  return { ok: true, item: finish({ id, type: 'EQV', concept: 'equiv', p: [a, b, d], text: `${a}/${b} = ?/${d}`, options: arrange(id, opts, order) }) };
}
const must = (r) => { if (!r.ok) throw new Error('rule clash ' + r.clash); return r.item; };

// Opening class check (option order fixed by the golden vector)
export const CHECK = [
  must(makeAdd('FR-ADD-04', 1, 2, 1, 3, [0, 2, 3, 1])),
  must(makeCmp('FR-CMP-02', 1, 2, 1, 3)),
  must(makeEqv('FR-EQV-07', 2, 4, 8, [1, 0, 2, 3])),
];
// 18 probes; every one splits at least two causes
export const PROBES = [
  ...[[1, 4, 1, 4], [2, 7, 3, 7], [1, 5, 2, 5], [3, 8, 2, 8], [1, 6, 4, 6]].map((p, i) => must(makeAdd(`FR-ADD-1${i}`, ...p))),
  ...[[2, 3, 1, 4], [1, 3, 1, 4], [1, 2, 1, 5], [2, 5, 1, 3]].map((p, i) => must(makeAdd(`FR-ADD-2${i}`, ...p))),
  ...[[1, 8, 1, 5], [1, 4, 1, 6], [2, 3, 2, 7], [3, 4, 3, 10], [1, 3, 1, 9]].map((p, i) => must(makeCmp(`FR-CMP-1${i}`, ...p))),
  ...[[1, 3, 6], [3, 5, 10], [2, 3, 9], [3, 4, 12]].map((p, i) => must(makeEqv(`FR-EQV-1${i}`, ...p))),
];
export const ALL_ITEMS = [...CHECK, ...PROBES];
export const ITEM = Object.fromEntries(ALL_ITEMS.map((i) => [i.id, i]));

// Day 3 / Day 10 rechecks: same idea, new numbers and a story around them
export const RECHECK = {
  bottom: ['FR-ADD-11', 'FR-ADD-13'], common: ['FR-ADD-20', 'FR-ADD-23'], opsense: ['FR-ADD-22', 'FR-ADD-12'],
  size: ['FR-CMP-12', 'FR-CMP-13'], equiv: ['FR-EQV-11', 'FR-EQV-13'],
};
