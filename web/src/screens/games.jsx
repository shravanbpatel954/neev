// Four original repair games. Wrong tries become a picture, never a red cross or a lost life.
import { useRef, useState } from 'preact/hooks';
import { buzz, sfx } from '../lib/fx.js';
import { lcm } from '../../../core/rules.js';
import { Btn, F, Icon, Maths, Say } from '../ui/bits.jsx';

const Dots = ({ n, i }) => <div class="gdots" aria-label={`Round ${i + 1} of ${n}`}>{Array.from({ length: n }, (_, k) => <i key={k} class={k < i ? 'd' : k === i ? 'c' : ''} />)}</div>;
function useRounds(n, onDone) { const [i, set] = useState(0); return [i, () => { if (i + 1 >= n) { sfx('win'); onDone(); } else { sfx('good'); set(i + 1); } }]; }
export function Strip({ n, d, color = 'var(--amber)', cut = d, label, ghost }) {
  return <div class="strip" role="img" aria-label={label || `${n} of ${d} shaded`}><div class="stripfill" style={`width:${(n / d) * 100}%;background:${color}`} />{ghost != null && <div class="ghostbar" style={`width:${ghost * 100}%`} />}<div class="cuts">{Array.from({ length: cut }, (_, i) => <i key={i} />)}</div></div>;
}

// 1. Rope Walk: place a fraction on the 0 to 1 line
export function RopeWalk({ onDone }) {
  const R = [[1, 2], [1, 4], [1, 8], [3, 4]], [i, next] = useRounds(R.length, onDone), [p, setP] = useState(0.06), [res, setRes] = useState(null), ref = useRef(), [n, d] = R[i], v = n / d;
  const move = (e) => { if (res) return; const r = ref.current.getBoundingClientRect(); setP(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); };
  const drop = () => { const err = Math.abs(p - v), ok = err < 0.06; setRes({ ok }); sfx(ok ? 'good' : 'think'); buzz(ok ? [12, 40, 12] : 30); };
  const key = (e) => { const k = { ArrowLeft: -0.02, ArrowRight: 0.02 }[e.key]; if (k && !res) { e.preventDefault(); setP(Math.max(0, Math.min(1, p + k))); } };
  return (
    <div class="game">
      <Dots n={R.length} i={i} />
      <h2>Walk Eeta to <F v={`${n}/${d}`} /></h2>
      <div class="ropewrap">
        <div class="rope" ref={ref} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={(e) => e.buttons && move(e)} role="slider" tabIndex={0} aria-label="Position on the rope" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)} onKeyDown={key}>
          <span class="ropeline" />
          {res && Array.from({ length: d + 1 }, (_, k) => <i key={k} class={`tickm ${k === n ? 'hit' : ''}`} style={`left:${(k / d) * 100}%`}><b>{k === 0 ? '0' : k === d ? '1' : `${k}/${d}`}</b></i>)}
          {!res && <><i class="tickm" style="left:0"><b>0</b></i><i class="tickm" style="left:100%"><b>1</b></i></>}
          <span class="walker" style={`left:${p * 100}%`}><svg viewBox="0 0 40 40" width="46"><rect x="6" y="14" width="28" height="20" rx="5" fill="#F2B035" /><path d="M8 15a12 10 0 0 1 24 0z" fill="#6EDFB3" /><circle cx="15" cy="23" r="3" fill="#fff" /><circle cx="25" cy="23" r="3" fill="#fff" /><circle cx="15.5" cy="23.5" r="1.6" /><circle cx="25.5" cy="23.5" r="1.6" /></svg></span>
        </div>
      </div>
      {!res ? <Btn onClick={drop}>Stop here</Btn> : (
        <><Say mood={res.ok ? 'happy' : 'think'}>{res.ok ? <>Right on the spot! {i > 0 && i < 3 ? 'See how a bigger bottom brings you closer to 0?' : 'Great balance.'}</> : <>Look: cut the rope into {d} equal parts, then take {n}. {d > 2 && n === 1 ? 'More parts means shorter steps.' : ''}</>}</Say>
          <Btn onClick={() => { if (res.ok) next(); setRes(null); setP(0.06); }}>{res.ok ? 'Next' : 'Try again'}</Btn></>
      )}
    </div>
  );
}

// 2. Strip Lab: find a cut that fits both strips, then count
export function StripLab({ onDone, intro = true }) {
  const R = [[1, 2, 1, 3], [1, 2, 1, 4], [2, 3, 1, 4]], [i, next] = useRounds(R.length, onDone), [st, setSt] = useState(intro ? 'shock' : 'cut'), [c, setC] = useState(2), [msg, setMsg] = useState(null), [pick, setPick] = useState(null);
  const [a, b, x, y] = R[i], L = lcm(b, y), fits = c % b === 0 && c % y === 0, top = (a * c) / b + (x * c) / y;
  const fit = () => { if (fits) { sfx('good'); buzz([10, 30, 10]); setSt('count'); setMsg(null); } else { sfx('think'); const bad = c % b ? [a, b] : [x, y]; setMsg(<>Cutting in {c} slices through the middle of a <F v={`1/${bad[1]}`} /> piece. Find a number both {b} and {y} go into.</>); } };
  if (st === 'shock') return (
    <div class="game">
      <h2>Could <Maths s="1/2 + 1/3 = 2/5" /> be right?</h2>
      <div class="stack" key="shock"><span class="sl"><F v="1/2" /></span><Strip n={1} d={2} /><span class="sl"><F v="2/5" /></span><Strip n={2} d={5} color="var(--coral)" ghost={0.5} /></div>
      <Say mood="wow">We started with <F v="1/2" /> and added more. How did it get smaller? Pieces of different sizes cannot be counted together.</Say>
      <Btn onClick={() => setSt('cut')}>Cut them to match</Btn>
    </div>
  );
  const choices = [...new Set([top, a + x, top + 1])].sort((m, n) => m - n);
  return (
    <div class="game">
      <Dots n={R.length} i={i} />
      <h2><Maths s={`${a}/${b} + ${x}/${y}`} /></h2>
      <div class="stack" key={i}><span class="sl"><F v={`${a}/${b}`} /></span><Strip n={a} d={b} cut={st === 'cut' ? c : c} color="var(--amber)" /><span class="sl"><F v={`${x}/${y}`} /></span><Strip n={x} d={y} cut={c} color="var(--mint)" />
        {st !== 'cut' && <><span class="sl">=</span><div class="strip join" role="img" aria-label="joined strip"><div class="stripfill" style={`width:${(a / b) * 100}%;background:var(--amber)`} /><div class="stripfill sec" style={`left:${(a / b) * 100}%;width:${(x / y) * 100}%;background:var(--mint)`} /><div class="cuts">{Array.from({ length: c }, (_, k) => <i key={k} />)}</div></div></>}
      </div>
      {st === 'cut' ? <>
        <p class="glabel">Cut both strips into <b class="bigc">{c}</b> equal pieces</p>
        <input class="range" type="range" min="2" max="12" value={c} aria-label="Number of pieces" onInput={(e) => { setC(+e.currentTarget.value); sfx('tick'); buzz(5); setMsg(null); }} />
        {msg && <Say mood="think" size={64}>{msg}</Say>}
        <Btn onClick={fit}>Do they fit?</Btn>
      </> : <>
        <p class="glabel">They fit! How many <F v={`1/${c}`} /> pieces altogether?</p>
        <div class="gopts">{choices.map((n) => <button key={n} class={`gopt ${pick === n ? (n === top ? 'yes' : 'look') : ''}`} onClick={() => { setPick(n); if (n === top) { sfx('good'); setTimeout(() => { next(); setSt('cut'); setC(2); setPick(null); }, 1100); } else { sfx('think'); } }}><F v={`${n}/${c}`} /></button>)}</div>
        {pick != null && <Say mood={pick === top ? 'happy' : 'think'} size={64}>{pick === top ? <>Yes! The tops count pieces. The bottom stays {c} because the size did not change.</> : 'Count every coloured piece on the joined strip.'}</Say>}
      </>}
      <p class="ghint">Smallest cut that fits: {st === 'cut' ? '?' : L}</p>
    </div>
  );
}

// 3. Twin Bridge: same amount, more pieces
export function TwinBridge({ onDone }) {
  const R = [[2, 4, 8], [1, 3, 6], [3, 5, 10]], [i, next] = useRounds(R.length, onDone), [k, setK] = useState(1), [pick, setPick] = useState(null), [a, b, d] = R[i], ok = b * k === d, ans = a * (d / b);
  const ch = [...new Set([ans, a + d - b, a])].sort((m, n) => m - n);
  return (
    <div class="game">
      <Dots n={R.length} i={i} />
      <h2><Maths s={`${a}/${b} = ?/${d}`} /></h2>
      <div class="stack"><span class="sl"><F v={`${a}/${b}`} /></span><Strip n={a} d={b} /><span class="sl"><F v={`?/${b * k}`} /></span><Strip n={a} d={b} cut={b * k} color="var(--blue)" /></div>
      <p class="glabel">Cut every piece into</p>
      <div class="gopts">{[2, 3, 4].map((n) => <button key={n} class={`gopt ${k === n ? (ok ? 'yes' : 'look') : ''}`} onClick={() => { setK(n); setPick(null); sfx('tick'); }}>{n}</button>)}</div>
      {k > 1 && !ok && <Say mood="think" size={64}>That makes {b * k} pieces. We need {d}.</Say>}
      {ok && <><p class="glabel">Now {d} pieces. The colour did not move. How many are coloured?</p><div class="gopts">{ch.map((n) => <button key={n} class={`gopt ${pick === n ? (n === ans ? 'yes' : 'look') : ''}`} onClick={() => { setPick(n); if (n === ans) { sfx('good'); setTimeout(() => { next(); setK(1); setPick(null); }, 1200); } else sfx('think'); }}>{n}</button>)}</div>
        {pick != null && <Say mood={pick === ans ? 'happy' : 'think'} size={64}>{pick === ans ? <>Every piece became {k}, so {a} × {k} = {ans}. Same amount!</> : 'Count the coloured pieces on the blue strip.'}</Say>}</>}
    </div>
  );
}

// 4. Story Sort: put together, or part of
export function StorySort({ onDone }) {
  const R = [['Meera drank 1/2 glass of milk, then 1/3 glass more.', '+'], ['Half of a 1/3 kg packet of sugar.', '×'], ['Ravi walked 1/4 km to the shop and 1/2 km to school.', '+'], ['A third of the 1/2 field is wheat.', '×'], ['1/5 of the wall on Monday, 2/5 on Tuesday.', '+'], ['She ate 1/2 of the 1/4 pizza left over.', '×']];
  const [i, next] = useRounds(R.length, onDone), [bad, setBad] = useState(false), [s, op] = R[i];
  const pick = (o) => { if (o === op) { setBad(false); next(); } else { sfx('think'); buzz(30); setBad(true); } };
  return (
    <div class="game">
      <Dots n={R.length} i={i} />
      <h2>Put together, or part of?</h2>
      <div class={`story ${bad ? 'shake' : ''}`} key={i}>{s}</div>
      <div class="sorter"><Btn kind="mint" onClick={() => pick('+')}><b>+</b> Put together</Btn><Btn kind="amber" onClick={() => pick('×')}><b>×</b> Part of</Btn></div>
      {bad && <Say mood="think" size={64}>{op === '+' ? 'Two amounts are joined, so the answer is more than each one.' : 'We take a part of something that is already a part, so it gets smaller.'}</Say>}
    </div>
  );
}
export const GAMES = {
  rope: { C: RopeWalk, name: 'Rope Walk', say: 'Where does a fraction live?', ic: 'fwd', col: 'r-amber' },
  strip: { C: StripLab, name: 'Strip Lab', say: 'Make the pieces match', ic: 'layers', col: 'r-mint' },
  twin: { C: TwinBridge, name: 'Twin Bridge', say: 'Same amount, more pieces', ic: 'sync', col: 'r-blue' },
  sort: { C: StorySort, name: 'Story Sort', say: 'Add or multiply?', ic: 'cards', col: 'r-coral' },
};
export const GAME_FOR = { TOPS_AND_BOTTOMS: 'strip', TOPS_ADD_BOTS_MULT: 'strip', MULTIPLY_INSTEAD: 'sort', BIGGER_BOTTOM_BIGGER: 'rope', ADDITIVE_EQUIV: 'twin' };
