// neev-core / bayes: P(h | answers) ∝ P(h) · Π P(o | h). Explainable on purpose.
import { HYP, HYPS } from './rules.js';
import { PROBES } from './items.js';

export const SLIP = 0.10, K = 4, SETTLE = 0.80, MIN_EVIDENCE = 2, MAX_PROBES = 2;

export function likelihood(item, option, h, side = 'sure') {
  const p = item.predict[h] === option ? 1 - SLIP : SLIP / (K - 1);
  return side === 'sure' ? p : 0.5 / K + 0.5 * p;
}
export const prior = () => Object.fromEntries(HYPS.map((h) => [h, HYP[h].prior]));
export function update(post, item, option, side) {
  const out = {}; let z = 0;
  for (const h of HYPS) { out[h] = post[h] * likelihood(item, option, h, side); z += out[h]; }
  for (const h of HYPS) out[h] /= z;
  return out;
}
export const posterior = (answers) => answers.reduce((p, a) => update(p, a.item, a.option, a.side), prior());
export const entropy = (p) => -HYPS.reduce((s, h) => s + (p[h] > 0 ? p[h] * Math.log2(p[h]) : 0), 0);
export const ranked = (p) => HYPS.map((h) => [h, p[h]]).sort((x, y) => y[1] - x[1]);

/** Expected information gain of a question for one belief state, in bits. */
export function eig(post, item) {
  const H = entropy(post); let exp = 0;
  for (const o of item.options) {
    let po = 0; const q = {};
    for (const h of HYPS) { q[h] = post[h] * likelihood(item, o.key, h, 'sure'); po += q[h]; }
    if (po <= 0) continue;
    for (const h of HYPS) q[h] /= po;
    exp += po * entropy(q);
  }
  return Math.max(0, H - exp);
}
/** Answers that match h where the correct method would have answered differently. */
export function evidenceFor(answers, h) {
  return answers.filter((a) => a.item.predict[h] === a.option && (h === 'CORRECT' || a.item.predict.CORRECT !== a.option)).length;
}
export function diagnose(answers) {
  const post = posterior(answers), [[top, p]] = ranked(post), evidence = evidenceFor(answers, top);
  const settled = answers.length > 0 && p >= SETTLE && evidence >= MIN_EVIDENCE;
  const tries = answers.filter((a) => a.probe && a.informative !== false).length;
  const handover = !settled && tries >= MAX_PROBES;
  return { post, top, p, evidence, settled, handover, open: !settled && !handover, label: settled ? top : handover ? 'CHECK' : null, group: settled ? HYP[top].group : handover ? 'check' : null };
}
/** Ranks unused probes by mean information gain over learners who are still open. */
export function rankProbes(openPosteriors, usedIds = [], pool = PROBES) {
  const n = openPosteriors.length || 1;
  return pool.filter((i) => !usedIds.includes(i.id))
    .map((item) => ({ item, bits: openPosteriors.reduce((s, p) => s + eig(p, item), 0) / n }))
    .sort((a, b) => b.bits - a.bits);
}
