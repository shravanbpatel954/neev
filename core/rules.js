// neev-core / rules: every misconception is a runnable rule, never a label.
export const ENGINE = '1.3.0';
export const PACK = 'fr-mr-2';

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const simplify = ([n, d]) => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
export const eqFrac = (x, y) => x[0] * y[1] === y[0] * x[1];
export const fracText = ([n, d]) => `${n}/${d}`;
export const lcm = (a, b) => (a * b) / gcd(a, b);

// Hypotheses: prior, owning concept, repair group
export const HYP = {
  CORRECT:              { prior: 0.42, concept: null,      group: 'moveon', short: 'Careless slip',      name: 'Understands it',                rule: '(ad + bc) / bd' },
  TOPS_AND_BOTTOMS:     { prior: 0.20, concept: 'bottom',  group: 'strips', short: 'Tops + bottoms',     name: 'Adds tops and bottoms',         rule: '(a + c) / (b + d)' },
  TOPS_ADD_BOTS_MULT:   { prior: 0.06, concept: 'common',  group: 'strips', short: 'Bottoms multiplied', name: 'Adds tops, multiplies bottoms', rule: '(a + c) / (b × d)' },
  MULTIPLY_INSTEAD:     { prior: 0.08, concept: 'opsense', group: 'opsort', short: 'Multiplies',         name: 'Multiplies instead of adding',  rule: '(a × c) / (b × d)' },
  BIGGER_BOTTOM_BIGGER: { prior: 0.14, concept: 'size',    group: 'roti',   short: 'Fraction size',      name: 'Bigger bottom means bigger',    rule: 'b > d  ⇒  a/b > c/d' },
  ADDITIVE_EQUIV:       { prior: 0.10, concept: 'equiv',   group: 'wall',   short: 'Adds to match',      name: 'Adds to make equivalent',       rule: 'a/b = (a + d − b)/d' },
};
export const HYPS = Object.keys(HYP);

export const GROUPS = {
  strips: { name: 'Strips huddle',  mode: 'Hands-on',   card: 'Fold a paper strip in 2 and another in 3. Are the pieces the same size? Cut both into sixths, then count.' },
  roti:   { name: 'Roti talk',      mode: 'Hands-on',   card: 'Share one roti among 2, then among 3. Whose piece is bigger? Say why more people means smaller pieces.' },
  wall:   { name: 'Multiply wall',  mode: 'Reasoning',  card: 'Cut every piece of 2/4 in two. The pieces double, the amount stays. Write it as × 2 on top and bottom.' },
  opsort: { name: 'Operation sort', mode: 'Peer talk',  card: 'Sort six stories into “put together” and “part of”. Explain each choice to your partner.' },
  moveon: { name: 'Move on',        mode: 'Stretch',    card: 'Invent a wrong worked solution. Ask a partner to find the mistake and say why it fails.' },
  check:  { name: 'Teacher check',  mode: 'One to one', card: 'Not enough evidence yet. Ask the child to explain one answer out loud.' },
};

// what a learner holding rule h answers on an addition
export const ADD_RULES = {
  CORRECT:            (a, b, c, d) => (b === d ? [a + c, b] : [(a * lcm(b, d)) / b + (c * lcm(b, d)) / d, lcm(b, d)]),
  TOPS_AND_BOTTOMS:   (a, b, c, d) => [a + c, b + d],
  TOPS_ADD_BOTS_MULT: (a, b, c, d) => [a + c, b * d],
  MULTIPLY_INSTEAD:   (a, b, c, d) => [a * c, b * d],
};
