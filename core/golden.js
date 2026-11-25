// Golden vector: fails the build if any target disagrees.
import { ITEM } from './items.js';
import { posterior } from './bayes.js';

export const GOLDEN = {
  input: [['FR-ADD-04', 'D', 'sure'], ['FR-CMP-02', 'A', 'sure'], ['FR-EQV-07', 'B', 'guess']],
  output: { CORRECT: 0.070118935, TOPS_AND_BOTTOMS: 0.901529164, TOPS_ADD_BOTS_MULT: 0.010016991, MULTIPLY_INSTEAD: 0.013355988, BIGGER_BOTTOM_BIGGER: 0.000865666, ADDITIVE_EQUIV: 0.004113257 },
};
export function runGolden() {
  const out = posterior(GOLDEN.input.map(([i, option, side]) => ({ item: ITEM[i], option, side })));
  const worst = Math.max(...Object.entries(GOLDEN.output).map(([h, v]) => Math.abs(out[h] - v)));
  return { out, worst, pass: worst < 1e-9 };
}
