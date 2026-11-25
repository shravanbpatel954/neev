// neev-core / graph: 15 concepts, prerequisites, BKT mastery and bottleneck ranking.
import { HYP } from './rules.js';

// x,y are layout hints on a 0..100 board
export const CONCEPTS = [
  ['whole', 'Whole-number operations', [], 7, 50],
  ['share', 'Equal sharing', ['whole'], 22, 30],
  ['bottom', 'What the bottom counts', ['share'], 37, 30],
  ['size', 'Fraction size', ['bottom'], 52, 10],
  ['line', 'Fractions on a line', ['size'], 71, 8],
  ['addlike', 'Adding like fractions', ['bottom'], 52, 40],
  ['mult', 'Factors and multiples', ['whole'], 22, 66],
  ['equiv', 'Equivalent fractions', ['bottom', 'mult'], 39, 60],
  ['simple', 'Simplest form', ['equiv'], 54, 84],
  ['compare', 'Comparing fractions', ['size', 'equiv'], 68, 26],
  ['common', 'Common denominators', ['equiv'], 60, 61],
  ['opsense', 'Add or multiply?', ['share'], 34, 90],
  ['addunlike', 'Fraction addition', ['common', 'addlike', 'opsense'], 79, 47],
  ['ratio', 'Ratio and proportion', ['equiv'], 78, 80],
  ['percent', 'Percentages', ['ratio', 'addunlike'], 93, 64],
].map(([id, name, pre, x, y]) => ({ id, name, pre, x, y }));
export const CONCEPT = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));

const kids = (id) => CONCEPTS.filter((c) => c.pre.includes(id)).map((c) => c.id);
export function downstream(id, seen = new Set()) {
  for (const k of kids(id)) if (!seen.has(k)) { seen.add(k); downstream(k, seen); }
  return [...seen];
}

export const BKT = { T: 0.10, S: 0.10, G: 0.25, L0: 0.45 };
export function bkt(pL, correct) {
  const { T, S, G } = BKT;
  const post = correct ? (pL * (1 - S)) / (pL * (1 - S) + (1 - pL) * G) : (pL * S) / (pL * S + (1 - pL) * (1 - G));
  return post + (1 - post) * T;
}
export function mastery(answers) {
  const m = {};
  for (const a of answers) m[a.item.concept] = bkt(m[a.item.concept] ?? BKT.L0, a.option === a.item.answer);
  return m;
}
/** (stuck / n) × (1 + blocked) × mean confidence */
export function bottlenecks(diagnoses) {
  const n = diagnoses.length || 1, by = {};
  diagnoses.forEach((d, i) => { const c = d.settled && HYP[d.top].concept; if (c) (by[c] ??= []).push({ i, p: d.p }); });
  return Object.entries(by).map(([concept, l]) => {
    const blocked = downstream(concept).length, conf = l.reduce((s, x) => s + x.p, 0) / l.length;
    return { concept, stuck: l.length, blocked, conf, score: (l.length / n) * (1 + blocked) * conf, who: l.map((x) => x.i) };
  }).sort((a, b) => b.score - a.score);
}
/** Progress changes only with fresh evidence. */
export function gapState(rechecks) {
  if (!rechecks.length || !rechecks.at(-1).ok) return 'open';
  return rechecks.filter((r) => r.ok).length >= 2 ? 'closed' : 'closing';
}
