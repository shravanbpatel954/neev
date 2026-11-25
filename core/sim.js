// neev-core / sim: virtual learners with a secret rule. Simulation only, never reported as classroom impact.
import { HYPS } from './rules.js';
import { CHECK, rng, shuffle } from './items.js';
import { diagnose, eig, posterior, rankProbes } from './bayes.js';

export const MIX = { CORRECT: 19, TOPS_AND_BOTTOMS: 11, TOPS_ADD_BOTS_MULT: 2, MULTIPLY_INSTEAD: 2, BIGGER_BOTTOM_BIGGER: 3, ADDITIVE_EQUIV: 3 };
export function makeClass(seed, mix = MIX) { return shuffle(Object.entries(mix).flatMap(([h, n]) => Array(n).fill(h)), rng(seed)); }

export function virtualAnswer(item, hidden, rnd, slip = 0.08, guess = 0.12) {
  if (rnd() < guess) { // unsure child: orange side, half the time a random option
    const o = rnd() < 0.5 ? item.options[Math.floor(rnd() * 4)].key : item.predict[hidden];
    return { item, option: o, side: 'guess' };
  }
  let option = item.predict[hidden];
  if (rnd() < slip) { const w = item.options.filter((o) => o.key !== option); option = w[Math.floor(rnd() * w.length)].key; }
  return { item, option, side: 'sure' };
}
export function runClass(seed, { slip = 0.08, mix = MIX, maxProbes = 4 } = {}) {
  const rnd = rng(seed * 7919 + 13), hidden = makeClass(seed, mix);
  const kids = hidden.map((h) => ({ hidden: h, answers: CHECK.map((i) => virtualAnswer(i, h, rnd, slip)) }));
  const used = []; let open;
  while ((open = kids.filter((k) => diagnose(k.answers).open)).length && used.length < maxProbes) {
    const best = rankProbes(open.map((k) => posterior(k.answers)), used)[0];
    used.push(best.item.id);
    for (const k of open) k.answers.push({ ...virtualAnswer(best.item, k.hidden, rnd, slip), probe: true, informative: eig(posterior(k.answers), best.item) > 0.05 });
  }
  return { probes: used.length, kids: kids.map((k) => ({ ...k, d: diagnose(k.answers) })) };
}
export function emptyReport() {
  return { classes: 0, learners: 0, hiddenGaps: 0, found: 0, wrongCause: 0, secure: 0, falseFlag: 0, unsure: 0, probes: 0, matrix: Object.fromEntries(HYPS.map((h) => [h, Object.fromEntries([...HYPS, 'CHECK'].map((g) => [g, 0]))])) };
}
export function addClass(r, res) {
  r.classes++; r.probes += res.probes;
  for (const k of res.kids) {
    r.learners++;
    const label = k.d.settled ? k.d.top : 'CHECK';
    r.matrix[k.hidden][label]++;
    if (label === 'CHECK') r.unsure++;
    if (k.hidden === 'CORRECT') { r.secure++; if (label !== 'CORRECT' && label !== 'CHECK') r.falseFlag++; }
    else { r.hiddenGaps++; if (label === k.hidden) r.found++; else if (label !== 'CHECK') r.wrongCause++; }
  }
  return r;
}
