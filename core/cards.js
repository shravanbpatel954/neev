// NeevCards: 4x4 ArUco-style markers plus a pure-JS detector. Marker = learner, rotation = answer, frame colour = confidence.
const N = 4;
const rot = (c) => { let o = 0; for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if ((c >> ((N - 1 - k) * N + r)) & 1) o |= 1 << (r * N + k); return o; };
const pop = (x) => { let n = 0; while (x) { x &= x - 1; n++; } return n; };
const rots = (c) => { const a = [c]; for (let i = 0; i < 3; i++) a.push(rot(a[i])); return a; };

/** 48 codes; every pair differs in >= 4 bits in every rotation, so one misread bit is safely corrected. */
export const CODES = (() => {
  const out = [];
  let x = 0x1d2b;
  for (let guard = 0; out.length < 48 && guard < 65536; guard++) {
    x = (x * 25173 + 13849) & 0xffff; // full-period LCG over 16 bits
    const r = rots(x), w = pop(x);
    if (w < 5 || w > 11) continue;
    if (r.slice(1).some((y) => pop(x ^ y) < 4)) continue;
    if (out.every((c) => r.every((y) => pop(c ^ y) >= 4))) out.push(x);
  }
  return out;
})();
export const bitsOf = (id) => Array.from({ length: 16 }, (_, i) => (CODES[id] >> i) & 1); // row-major, 1 = white cell

const LETTER = ['A', 'B', 'C', 'D'];
export function decode(code) {
  let best = null;
  const r = rots(code);
  for (let id = 0; id < CODES.length; id++) for (let k = 0; k < 4; k++) {
    const d = pop(CODES[id] ^ r[k]);
    if (d <= 1 && (!best || d < best.d)) best = { id, k, d };
  }
  return best;
}

function toGray(img, w, h) {
  const g = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (img[j] * 77 + img[j + 1] * 150 + img[j + 2] * 29) >> 8;
  return g;
}
function darkMask(g, w, h) { // adaptive threshold via integral image
  const I = new Uint32Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) { s += g[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + s; } }
  const R = Math.max(8, Math.round(Math.max(w, h) / 45)), m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - R), y1 = Math.min(h, y + R + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - R), x1 = Math.min(w, x + R + 1), n = (x1 - x0) * (y1 - y0);
      const s = I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0];
      m[y * w + x] = g[y * w + x] * n < s * 0.82 ? 1 : 0;
    }
  }
  return m;
}
function homography(q) { // unit square (TL,TR,BR,BL) -> quad
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, sx = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1; if (Math.abs(den) < 1e-6) return null;
  const g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return (u, v) => { const z = g * u + h * v + 1; return [(a * u + b * v + x0) / z, (d * u + e * v + y0) / z]; };
}

/** img: RGBA bytes. Returns [{id, option, side, corners}] */
export function detect(img, w, h) {
  const g = toGray(img, w, h), m = darkMask(g, w, h), seen = new Uint8Array(w * h), stack = new Int32Array(w * h), found = [];
  const px = (x, y) => g[Math.min(h - 1, Math.max(0, Math.round(y))) * w + Math.min(w - 1, Math.max(0, Math.round(x)))];
  for (let s = 0; s < m.length; s++) {
    if (!m[s] || seen[s]) continue;
    let top = 0, n = 0, minx = w, maxx = 0, miny = h, maxy = 0; const edge = [];
    stack[top++] = s; seen[s] = 1;
    while (top) {
      const p = stack[--top], x = p % w, y = (p / w) | 0; n++;
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      let e = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      for (let k = 0; k < 4; k++) {
        const nx = x + (k === 0) - (k === 1), ny = y + (k === 2) - (k === 3);
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx; if (!m[q]) { e = true; continue; } if (!seen[q]) { seen[q] = 1; stack[top++] = q; }
      }
      if (e) edge.push(x, y);
    }
    const bw = maxx - minx, bh = maxy - miny;
    if (bw < 15 || bh < 15 || n < 110 || bw > w * 0.9 || bh > h * 0.95 || bw / bh > 2.6 || bh / bw > 2.6) continue;
    const corners = quad(edge); if (!corners) continue;
    const H = homography(corners); if (!H) continue;
    // sample 6x6 cells
    const cell = []; let lo = 255, hi = 0;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
      let v = 0; for (const [du, dv] of [[0.5, 0.5], [0.35, 0.5], [0.65, 0.5], [0.5, 0.35], [0.5, 0.65]]) { const [x, y] = H((c + du) / 6, (r + dv) / 6); v += px(x, y); }
      v /= 5; cell.push(v); if (v < lo) lo = v; if (v > hi) hi = v;
    }
    if (hi - lo < 40) continue;
    const mid = (hi + lo) / 2; let badBorder = 0, code = 0;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
      const white = cell[r * 6 + c] > mid;
      if (r === 0 || c === 0 || r === 5 || c === 5) badBorder += white; else if (white) code |= 1 << ((r - 1) * 4 + (c - 1));
    }
    if (badBorder > 1) continue;
    const hit = decode(code); if (!hit) continue;
    // confidence: read the coloured frame just outside the white quiet zone
    let red = 0, blue = 0;
    for (const [u, v] of [[-0.27, -0.27], [1.27, -0.27], [1.27, 1.27], [-0.27, 1.27]]) {
      const [x, y] = H(u, v); if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const j = (Math.round(y) * w + Math.round(x)) * 4; if (j + 2 < img.length && j >= 0) { red += img[j]; blue += img[j + 2]; }
    }
    found.push({ id: hit.id, option: LETTER[hit.k], side: blue >= red ? 'sure' : 'guess', corners });
  }
  const count = {}; found.forEach((f) => (count[f.id] = (count[f.id] || 0) + 1));
  return found.filter((f) => count[f.id] === 1); // duplicates are ignored
}
function quad(e) {
  const n = e.length / 2; if (n < 20) return null;
  let cx = 0, cy = 0; for (let i = 0; i < e.length; i += 2) { cx += e[i]; cy += e[i + 1]; } cx /= n; cy /= n;
  const far = (x, y) => { let b = -1, bi = 0; for (let i = 0; i < e.length; i += 2) { const d = (e[i] - x) ** 2 + (e[i + 1] - y) ** 2; if (d > b) { b = d; bi = i; } } return [e[bi], e[bi + 1]]; };
  const a = far(cx, cy), c = far(a[0], a[1]);
  let hi = 0, lo = 0, b = null, d = null;
  for (let i = 0; i < e.length; i += 2) { const s = (c[0] - a[0]) * (e[i + 1] - a[1]) - (c[1] - a[1]) * (e[i] - a[0]); if (s > hi) { hi = s; b = [e[i], e[i + 1]]; } if (s < lo) { lo = s; d = [e[i], e[i + 1]]; } }
  if (!b || !d) return null;
  const pts = [a, d, c, b]; // clockwise on screen (y down)
  const side = pts.map((p, i) => Math.hypot(p[0] - pts[(i + 1) % 4][0], p[1] - pts[(i + 1) % 4][1]));
  if (Math.min(...side) < 11 || Math.max(...side) / Math.min(...side) > 2.4) return null;
  // outline must hug the quad: reject blobs that are not square-ish
  let off = 0;
  for (let i = 0; i < e.length; i += 2) {
    let inside = true;
    for (let k = 0; k < 4; k++) { const p = pts[k], q = pts[(k + 1) % 4], s = ((q[0] - p[0]) * (e[i + 1] - p[1]) - (q[1] - p[1]) * (e[i] - p[0])) / side[k]; if (s < -2.2) { inside = false; break; } }
    if (!inside) off++;
  }
  if (off / n > 0.12) return null;
  // start at the corner nearest top-left so rotation is measured against "up"
  const order = pts.map((p, i) => [p[0] + p[1], i]).sort((x, y) => x[0] - y[0])[0][1];
  return [0, 1, 2, 3].map((i) => pts[(order + i) % 4]);
}

/** Counts an answer only after `need` matching frames. */
export class Confirmer {
  constructor(need = 3) { this.need = need; this.run = new Map(); this.done = new Map(); }
  push(dets) {
    const fresh = [];
    for (const d of dets) {
      const key = d.option + d.side, r = this.run.get(d.id);
      const n = r && r.key === key ? r.n + 1 : 1; this.run.set(d.id, { key, n });
      if (n >= this.need && !this.done.has(d.id)) { this.done.set(d.id, { option: d.option, side: d.side }); fresh.push(d); }
    }
    return fresh;
  }
}

/** Draws one card centred at 0,0 with the given total size. Letters: A top, B right, C bottom, D left. */
export function drawCard(ctx, id, size, side, label = true) {
  const u = size / 14; // 14 units: frame 3 + quiet 1 + marker 6 + quiet 1 + frame 3
  ctx.fillStyle = side === 'sure' ? '#2F7FE0' : '#FF8A3D'; ctx.fillRect(-7 * u, -7 * u, 14 * u, 14 * u);
  ctx.fillStyle = '#fff'; ctx.fillRect(-4 * u, -4 * u, 8 * u, 8 * u);
  ctx.fillStyle = '#0B2B2A'; ctx.fillRect(-3 * u, -3 * u, 6 * u, 6 * u);
  ctx.fillStyle = '#fff'; bitsOf(id).forEach((b, i) => { if (b) ctx.fillRect((-2 + (i % 4)) * u, (-2 + Math.floor(i / 4)) * u, u * 1.02, u * 1.02); });
  if (label) {
    ctx.font = `800 ${2.4 * u}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [['A', 0, -5.5], ['B', 5.5, 0], ['C', 0, 5.5], ['D', -5.5, 0]].forEach(([t, x, y], i) => { ctx.save(); ctx.translate(x * u, y * u); ctx.rotate((i * Math.PI) / 2); ctx.fillText(t, 0, 0); ctx.restore(); });
  }
}
/** Degrees to turn a card so that letter is on top. */
export const TURN = { A: 0, B: -90, C: 180, D: 90 };
