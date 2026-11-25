import { useEffect, useRef, useState } from 'preact/hooks';
import { HYP, ranked } from '../../../core/index.js';
import { sfx, buzz } from '../lib/fx.js';
import { t } from '../lib/i18n.js';

const P = {
  home: 'M3 11 12 4l9 7v9h-6v-6H9v6H3z', play: 'M7 4v16l13-8z', scan: 'M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M4 12h16', board: 'M4 5h16v11H4zM9 20h6M12 16v4', more: 'M5 12h.01M12 12h.01M19 12h.01',
  map: 'M5 19V9m7 10V5m7 14v-6', note: 'M6 3h9l4 4v14H6zM9 12h7M9 16h5', studio: 'M4 20l4-1L20 7l-3-3L5 16zM14 7l3 3', lab: 'M9 3h6M10 3v6l-5 10a1.5 1.5 0 0 0 1.4 2h11.2A1.5 1.5 0 0 0 19 19L14 9V3M8 15h8', mind: 'M12 3a7 7 0 0 0-4 12.7V20h8v-4.3A7 7 0 0 0 12 3zM10 20h4M9.5 10.5a2.5 2.5 0 0 1 5 0c0 1.8-2.5 1.8-2.5 3.5',
  sync: 'M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5', layers: 'm12 3 9 5-9 5-9-5zM3 13l9 5 9-5', star: 'm12 3 2.7 5.8 6.3.8-4.6 4.3 1.2 6.3L12 17.1 6.4 20.2l1.2-6.3L3 9.6l6.3-.8z', phone: 'M8 2h8a1.5 1.5 0 0 1 1.5 1.5v17A1.5 1.5 0 0 1 16 22H8a1.5 1.5 0 0 1-1.5-1.5v-17A1.5 1.5 0 0 1 8 2zM11 18.5h2', web: 'M3 5h18v12H3zM8 21h8M12 17v4',
  vol: 'M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12', mute: 'M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6', plane: 'm3 13 18-9-6 17-3-7z', wifi: 'M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01', check: 'm5 12 5 5 9-11', x: 'M6 6l12 12M18 6 6 18', back: 'M15 5l-7 7 7 7', fwd: 'M9 5l7 7-7 7', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6', cards: 'M4 6h11v14H4zM8 6V3h12v14h-5', users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 4 6', clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3.5 2', undo: 'M4 4v6h6M4.5 10A8 8 0 1 1 5 16', bolt: 'M13 2 4 14h7l-1 8 9-12h-7z', globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18', search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5', share: 'M12 15V3M8 7l4-4 4 4M5 13v7h14v-7',
};
export const Icon = ({ n, s = 20 }) => <svg class="ico" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={P[n]} /></svg>;

export const F = ({ v }) => { const [a, b] = String(v).split('/'); return b === undefined ? <span class="num">{a}</span> : <span class="frac" role="img" aria-label={`${a} over ${b}`}><span>{a}</span><i /><span>{b}</span></span>; };
/** Renders "1/2 + 1/3 = ?" with stacked fractions. */
export const Maths = ({ s }) => <span class="maths">{String(s).split(/(\d+\/\d+|\?\/\d+)/).map((x, i) => (i % 2 ? <F v={x} key={i} /> : <span key={i}>{x}</span>))}</span>;
export function Question({ item }) {
  if (item.type !== 'CMP') return <Maths s={item.text} />;
  const [a, b, c, d] = item.p; return <span class="cmp"><Maths s={t('bigger', { a: `${a}/${b}`, b: `${c}/${d}` })} /></span>;
}
export const Opt = ({ o }) => (o.word ? <span class="word">{t(o.word)}</span> : <F v={o.label} />);

export function Btn({ kind = 'go', class: c = '', onClick, sfx: s = 'tap', children, ...p }) {
  return <button class={`btn ${kind} ${c}`} onClick={(e) => { sfx(s); buzz(8); onClick?.(e); }} {...p}>{children}</button>;
}
export const Note = ({ children, tilt = -2, class: c = '' }) => <div class={`sticky ${c}`} style={`--tilt:${tilt}deg`}>{children}</div>;
export const Tag = ({ kind = '', children }) => <span class={`tag ${kind}`}>{children}</span>;
export const Head = ({ eyebrow, title, children }) => <header class="head">{eyebrow && <p class="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{children && <p class="lead">{children}</p>}</header>;

/** Eeta: an original amber brick with a mint hard hat. */
export function Eeta({ mood = 'happy', size = 96 }) {
  const mouth = { happy: 'M38 68q12 11 24 0', wow: 'M44 66a6 7 0 1 0 12 0a6 7 0 1 0-12 0', think: 'M42 70q8-5 16 1', oops: 'M39 73q11-9 22 0' }[mood];
  return (
    <svg class={`eeta ${mood}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs><linearGradient id="ebody" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#FFD36B" /><stop offset="1" stop-color="#F49A1A" /></linearGradient><linearGradient id="ehat" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#A9FADB" /><stop offset="1" stop-color="#2FBE8E" /></linearGradient></defs>
      <ellipse cx="50" cy="93" rx="28" ry="4.5" fill="#000" opacity=".28" />
      <g class="eb">
        <path d="M34 84v7M66 84v7" stroke="#7A4A12" stroke-width="6" stroke-linecap="round" />
        <path class="arm" d="M16 62q-9 2-9 11M84 62q9-4 8-15" stroke="#C9861C" stroke-width="6" stroke-linecap="round" fill="none" />
        <rect x="14" y="34" width="72" height="51" rx="16" fill="#B8710F" /><rect x="14" y="32" width="72" height="49" rx="16" fill="url(#ebody)" /><rect x="21" y="42" width="30" height="6" rx="3" fill="#fff" opacity=".28" />
        
        <g class="eyes"><circle cx="37" cy="53" r="7.5" fill="#fff" /><circle cx="63" cy="53" r="7.5" fill="#fff" /><circle cx={mood === 'think' ? 40 : 38} cy={mood === 'think' ? 50 : 54} r="4" fill="#0B2B2A" /><circle cx={mood === 'think' ? 66 : 64} cy={mood === 'think' ? 50 : 54} r="4" fill="#0B2B2A" /></g>
        <path d={mouth} stroke="#7A4A12" stroke-width="3.6" stroke-linecap="round" fill={mood === 'wow' ? '#7A4A12' : 'none'} />
        <path d="M20 36a30 26 0 0 1 60 0z" fill="url(#ehat)" /><path d="M44 11.5q6-2 12 0V34H44z" fill="#D6FFF0" opacity=".75" /><rect x="11" y="31" width="78" height="8.5" rx="4.25" fill="#1FA97E" />
      </g>
    </svg>
  );
}
export const Say = ({ mood, size = 84, children }) => <div class="say"><Eeta mood={mood} size={size} /><div class="bubble" aria-live="polite">{children}</div></div>;

export function Bar({ v, color = 'var(--coral)', label, right }) {
  return <div class="barrow">{label && <span class="bl">{label}</span>}<span class="bar"><i style={`width:${Math.max(0, Math.min(1, v)) * 100}%;background:${color}`} /></span><b class="br">{right ?? Math.round(v * 100) + '%'}</b></div>;
}
export const HC = { CORRECT: 'var(--leaf)', TOPS_AND_BOTTOMS: 'var(--coral)', TOPS_ADD_BOTS_MULT: '#E0559A', MULTIPLY_INSTEAD: '#8B6CF0', BIGGER_BOTTOM_BIGGER: 'var(--amber)', ADDITIVE_EQUIV: 'var(--blue)' };
export function Belief({ post, n = 6, correctName = 'Understands it' }) {
  const order = ranked(post).slice(0, n);
  return <div class="belief">{order.map(([h, p]) => <Bar key={h} v={p} color={HC[h]} label={h === 'CORRECT' ? correctName : HYP[h].short} right={p > 0.995 ? '>99%' : (p * 100).toFixed(p < 0.095 ? 1 : 0) + '%'} />)}</div>;
}
export function Ring({ v, size = 34, color = 'var(--leaf)', children }) {
  const r = size / 2 - 3, c = 2 * Math.PI * r;
  return <span class="ring" style={`width:${size}px;height:${size}px`}><svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" opacity=".14" stroke-width="4" /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} stroke-width="4" stroke-linecap="round" stroke-dasharray={`${c * v} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} /></svg><b>{children}</b></span>;
}

export function Sheet({ title, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const last = document.activeElement; ref.current?.focus();
    const k = (e) => { if (e.key === 'Escape') onClose(); }; addEventListener('keydown', k);
    return () => { removeEventListener('keydown', k); last?.focus?.(); };
  }, []);
  return <div class="scrim" onClick={onClose}><section class="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}><div class="sheethead"><h2>{title}</h2><button class="iconbtn" onClick={onClose} aria-label="Close"><Icon n="x" /></button></div>{children}</section></div>;
}

/** Isometric tower. bricks listed bottom-up: {id,name,state: ok|gap|blocked|fixed|idle} */
const PAL = { ok: ['#12855F', '#0B5A44', '#63E6B6'], fixed: ['#F5A92B', '#B8710F', '#FFDC86'], blocked: ['#BFEFE0', '#BFEFE0', '#E6FFF7'], gap: ['#FF6B4A', '#FF6B4A', '#FF9C83'] };
const VIVID = [['#12855F', '#0B5A44', '#63E6B6'], ['#2C72D6', '#1B4690', '#83B9FF'], ['#7657DB', '#4A3399', '#B3A0FF'], ['#C2457F', '#7F2650', '#FF93C2'], ['#A9570A', '#6E3805', '#FFB05C'], ['#12838F', '#0A525B', '#62DCE6'], ['#C0472C', '#7D2914', '#FF9A80']];
export function Tower({ bricks, wobble, onPick, w = 340, vivid }) {
  const L = 196, R = 78, H = 42, k = 0.866, gap = 5;
  const h = bricks.length * (H + gap) + (L + R) * 0.5 + 40, gi = bricks.findIndex((b) => b.state === 'gap');
  const cx = 42, W = (L + R) * k + 84;
  const pts = (...a) => a.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  const colours = (b, i) => (vivid && (b.state === 'ok' || b.state === 'idle') ? VIVID[i % 7] : PAL[b.state] || PAL.ok);
  return (
    <svg class={`tower ${wobble ? 'wob' : ''}`} viewBox={`0 0 ${W} ${h}`} style={`max-width:${w}px`} role="img" aria-label={'Concept tower: ' + bricks.map((b) => `${b.name} ${b.state}`).join(', ')}>
      <defs>
        {bricks.map((b, i) => { const c = colours(b, i), key = c[0].slice(1); return ['l', 'r', 't'].map((f, n) => <linearGradient key={f + i} id={`g${key}${f}`} x1="0" y1="0" x2={f === 't' ? 1 : 0.25} y2={f === 't' ? 0.6 : 1}><stop offset="0" stop-color={c[n]} /><stop offset="1" stop-color={f === 't' ? c[0] : c[1]} /></linearGradient>); })}
        <radialGradient id="pool"><stop offset="0" stop-color="#000" stop-opacity=".5" /><stop offset="1" stop-color="#000" stop-opacity="0" /></radialGradient>
        <radialGradient id="ember"><stop offset="0" stop-color="#FF6B4A" stop-opacity=".55" /><stop offset="1" stop-color="#FF6B4A" stop-opacity="0" /></radialGradient>
      </defs>
      <ellipse cx={W / 2} cy={h - 46} rx={W * 0.56} ry="52" fill="url(#pool)" />
      {bricks.map((b, i) => {
        const jx = ((i * 37) % 13) - 6, x0 = cx + jx, yb = h - 22 - L * 0.5 - i * (H + gap), g = b.state === 'gap', ghost = b.state === 'blocked';
        const key = colours(b, i)[0].slice(1);
        const A = [x0, yb], B = [x0 + L * k, yb + L * 0.5], Cc = [x0 + (L + R) * k, yb + (L - R) * 0.5], D = [x0 + R * k, yb - R * 0.5], up = ([x, y]) => [x, y - H];
        const face = (f) => (ghost ? { fill: '#CFFBEC', 'fill-opacity': f === 't' ? 0.2 : f === 'l' ? 0.1 : 0.05, stroke: '#CFFBEC', 'stroke-opacity': 0.42, 'stroke-width': 1.2 } : g ? { fill: '#FF6B4A', 'fill-opacity': f === 't' ? 0.3 : 0.16, stroke: '#FF8467', 'stroke-width': 2, 'stroke-dasharray': '7 6' } : { fill: `url(#g${key}${f})`, stroke: `url(#g${key}${f})`, 'stroke-width': 5 });
        return (
          <g key={b.id} class={`bk ${b.state} ${gi >= 0 && i > gi ? 'above' : ''}`} style={`--i:${i}`} onClick={onPick ? () => onPick(b) : undefined} cursor={onPick ? 'pointer' : undefined}>
            {g && <ellipse cx={(A[0] + Cc[0]) / 2} cy={yb - 8} rx={L * 0.95} ry="92" fill="url(#ember)" class="ember" />}
            <g stroke-linejoin="round">
              <polygon points={pts(up(A), up(B), up(Cc), up(D))} {...face('t')} />
              <polygon points={pts(A, B, up(B), up(A))} {...face('l')} />
              <polygon points={pts(B, Cc, up(Cc), up(B))} {...face('r')} />
            </g>
            {!g && !ghost && <path d={`M${up(A).join(' ')}L${up(B).join(' ')}L${up(Cc).join(' ')}`} fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-linejoin="round" />}
            <text transform={`matrix(${k} .5 0 1 ${x0 + 12} ${yb - 15})`} class={`bt ${b.state}`} textLength={b.name.length > 21 ? L - 24 : undefined} lengthAdjust="spacingAndGlyphs">{b.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

export const Switch = ({ on, set, label }) => <button class={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={() => set(!on)}><i />{label}</button>;
export function Count({ to, ms = 900, suffix = '' }) {
  const [v, set] = useState(0);
  useEffect(() => { let a, s; const f = (n) => { s ??= n; const p = Math.min(1, (n - s) / ms); set(to * (1 - (1 - p) ** 3)); if (p < 1) a = requestAnimationFrame(f); }; a = requestAnimationFrame(f); const z = setTimeout(() => set(to), ms + 200); return () => { cancelAnimationFrame(a); clearTimeout(z); }; }, [to]);
  return <>{Number.isInteger(to) ? Math.round(v) : v.toFixed(1)}{suffix}</>;
}
export const Lazy = ({ load, ...p }) => { const [C, set] = useState(null); useEffect(() => { let on = true; load().then((m) => on && set(() => m.default)); return () => { on = false; }; }, [load]); return C ? <C {...p} /> : <div class="loading"><Eeta mood="think" /></div>; };
