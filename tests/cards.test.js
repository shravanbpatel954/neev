import test from 'node:test';
import assert from 'node:assert/strict';
import { CODES, Confirmer, TURN, bitsOf, detect } from '../core/cards.js';
import { rng } from '../core/items.js';

// tiny software renderer so the real detector is tested on real pixels
function scene(cards, W = 960, H = 640, { light = 1, noise = 0, seed = 1 } = {}) {
  const rnd = rng(seed), img = new Uint8ClampedArray(W * H * 4).fill(255);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = [196, 188, 170];
    for (const k of cards) {
      const a = (-(TURN[k.option] + k.tilt) * Math.PI) / 180, dx = x - k.x, dy = y - k.y;
      const u = ((dx * Math.cos(a) - dy * Math.sin(a)) / k.size) * 14, v = ((dx * Math.sin(a) + dy * Math.cos(a)) / k.size) * 14;
      if (Math.abs(u) > 7 || Math.abs(v) > 7) continue;
      if (Math.abs(u) > 4 || Math.abs(v) > 4) c = k.side === 'sure' ? [47, 127, 224] : [255, 138, 61];
      else if (Math.abs(u) > 3 || Math.abs(v) > 3) c = [255, 255, 255];
      else if (Math.abs(u) >= 2 || Math.abs(v) >= 2) c = [11, 43, 42];
      else c = bitsOf(k.id)[Math.floor(v + 2) * 4 + Math.floor(u + 2)] ? [255, 255, 255] : [11, 43, 42];
    }
    const j = (y * W + x) * 4, n = (rnd() - 0.5) * noise, l = light * (0.75 + 0.25 * (x / W));
    for (let i = 0; i < 3; i++) img[j + i] = c[i] * l + n;
  }
  return img;
}
const grid = (seed, tilt = 12) => {
  const rnd = rng(seed);
  return Array.from({ length: 40 }, (_, id) => ({ id, x: 65 + (id % 8) * 118 + rnd() * 8, y: 66 + Math.floor(id / 8) * 125 + rnd() * 8, size: 82 + rnd() * 14, tilt: (rnd() - 0.5) * 2 * tilt, option: 'ABCD'[Math.floor(rnd() * 4)], side: rnd() < 0.5 ? 'sure' : 'guess' }));
};
const score = (cards, dets) => { const by = new Map(dets.map((d) => [d.id, d])); let ok = 0, wrong = 0; for (const c of cards) { const d = by.get(c.id); if (d) d.option === c.option && d.side === c.side ? ok++ : wrong++; } return { ok, wrong, extra: dets.length - ok - wrong }; };

test('48 marker codes', () => assert.equal(CODES.length, 48));
for (const [name, opt] of [['bright room', { noise: 14 }], ['dim room', { light: 0.35, noise: 10 }]])
  test(`reads 40 cards in one frame: ${name}`, (t) => {
    const cards = grid(5), s = score(cards, detect(scene(cards, 960, 640, opt), 960, 640));
    t.diagnostic(JSON.stringify(s));
    assert.equal(s.wrong, 0); assert.equal(s.extra, 0); assert.ok(s.ok >= 36, 'read ' + s.ok);
  });
test('empty noisy scene yields no phantom cards', () => assert.equal(detect(scene([], 960, 640, { noise: 60 }), 960, 640).length, 0));
test('an answer counts only after three matching frames', () => {
  const c = new Confirmer(3), d = { id: 1, option: 'A', side: 'sure' };
  assert.equal(c.push([d]).length, 0); assert.equal(c.push([d]).length, 0);
  assert.equal(c.push([{ ...d, option: 'B' }]).length, 0);
  c.push([d]); c.push([d]); assert.equal(c.push([d]).length, 1); assert.equal(c.push([d]).length, 0);
});
