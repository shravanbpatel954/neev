import { sound } from './store.js';

export const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const buzz = (p = 12) => { try { if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(p); } catch { /* unsupported */ } };

// tiny synth: no audio files to download
let ac;
function tone(f, t, d, type = 'triangle', v = 0.12) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, ac.currentTime + t);
  g.gain.setValueAtTime(v, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + d);
  o.connect(g).connect(ac.destination); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + d);
}
const S = {
  tap: () => tone(420, 0, 0.07), tick: () => tone(880, 0, 0.05, 'sine', 0.05),
  good: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.18)),
  think: () => [392, 330].forEach((f, i) => tone(f, i * 0.12, 0.2, 'sine')),
  thud: () => { tone(110, 0, 0.22, 'square', 0.1); tone(70, 0.02, 0.3, 'sine', 0.2); },
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25)),
};
export function sfx(name) {
  if (!sound.value) return;
  try { ac ??= new AudioContext(); if (ac.state === 'suspended') ac.resume(); S[name]?.(); } catch { /* no audio */ }
}

// brick confetti on one shared canvas
export function confetti(n = 90) {
  if (calm()) return;
  const host = document.querySelector('.app') || document.body, c = document.createElement('canvas'), r = host.getBoundingClientRect(), x = c.getContext('2d');
  c.width = r.width; c.height = r.height; c.className = 'confetti'; host.append(c);
  const col = ['#F2B035', '#6EDFB3', '#FF6F59', '#2F7FE0', '#FFE7B0'];
  const p = Array.from({ length: n }, (_, i) => ({ x: r.width * (0.5 + (Math.random() - 0.5) * 0.3), y: r.height * 0.45, vx: (Math.random() - 0.5) * 13, vy: -6 - Math.random() * 10, a: Math.random() * 6, w: 8 + Math.random() * 10, c: col[i % 5] }));
  let t = 0;
  (function f() {
    x.clearRect(0, 0, c.width, c.height);
    for (const b of p) { b.vy += 0.42; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.a += 0.12; x.save(); x.translate(b.x, b.y); x.rotate(b.a); x.fillStyle = b.c; x.fillRect(-b.w / 2, -b.w / 4, b.w, b.w / 2); x.restore(); }
    if (++t < 130) requestAnimationFrame(f); else c.remove();
  })();
}

const VO = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
export function speak(text, l = 'en', onend) {
  try {
    const s = speechSynthesis; s.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = VO[l]; u.rate = 0.95;
    const v = s.getVoices().find((x) => x.lang === VO[l]) || s.getVoices().find((x) => x.lang.startsWith(l)); if (v) u.voice = v;
    if (onend) { u.onend = onend; u.onerror = onend; }
    s.speak(u); return true;
  } catch { onend?.(); return false; }
}
export const hush = () => { try { speechSynthesis.cancel(); } catch { /* none */ } };
export const sayFrac = (s) => s.replace(/(\d+)\/(\d+)/g, '$1 over $2').replace('?', 'what').replace('+', 'plus');
