import { useEffect, useRef, useState } from 'preact/hooks';
import { GOLDEN, HYP, HYPS, addClass, emptyReport, runClass, runGolden } from '../../../core/index.js';
import { serverGolden } from '../lib/net.js';
import { stamp } from '../lib/store.js';
import { Btn, Head, Icon, Tag } from '../ui/bits.jsx';

export default function Lab() {
  const [n, setN] = useState(100), [slip, setSlip] = useState(8), [r, setR] = useState(null), [busy, setBusy] = useState(false), [g, setG] = useState(null), stop = useRef(0);
  const run = () => {
    const me = ++stop.current, rep = emptyReport(); let s = 0; setBusy(true); stamp('lab');
    const step = () => { if (stop.current !== me) return; const t = performance.now(); while (s < n && performance.now() - t < 14) addClass(rep, runClass(++s, { slip: slip / 100 })); setR({ ...rep }); if (s < n) setTimeout(step); else setBusy(false); };
    step();
  };
  useEffect(() => { run(); return () => { stop.current++; }; }, []);
  const golden = async () => { const a = runGolden(); let b; try { b = await serverGolden(); } catch { b = { pass: false, out: {} }; } setG({ a, b }); };
  useEffect(() => { golden(); }, []);
  const pc = (a, b) => (b ? (100 * a) / b : 0).toFixed(1) + '%';
  return (
    <div class="page">
      <Head eyebrow="Engine lab" title="Hide a cause, see if Neev finds it">Each virtual learner gets a secret wrong method, plus random slips and guesses. The engine runs without knowing it.</Head>
      <section class="card labctl"><label>Classes of 40 <b>{n}</b><input class="range" type="range" min="10" max="300" step="10" value={n} onInput={(e) => setN(+e.currentTarget.value)} /></label><label>Careless slips <b>{slip}%</b><input class="range" type="range" min="0" max="25" value={slip} onInput={(e) => setSlip(+e.currentTarget.value)} /></label><Btn onClick={run} disabled={busy}><Icon n="bolt" /> {busy ? `${r?.classes ?? 0} classes` : 'Run simulation'}</Btn></section>
      {r && <>
        <div class="stats" data-t="stats"><div class="stat ok"><b>{pc(r.found, r.hiddenGaps)}</b><span>hidden causes found exactly</span></div><div class="stat"><b>{pc(r.falseFlag, r.secure)}</b><span>secure learners wrongly flagged</span></div><div class="stat"><b>{pc(r.unsure, r.learners)}</b><span>handed to the teacher as unsure</span></div><div class="stat"><b>{(r.probes / r.classes).toFixed(1)}</b><span>class probes per check</span></div></div>
        <section class="card scrollx"><h3>What was hidden, and what Neev said</h3><table class="conf"><thead><tr><th scope="col">Hidden</th>{[...HYPS, 'CHECK'].map((h) => <th key={h} scope="col">{h === 'CHECK' ? 'Ask teacher' : h === 'CORRECT' ? 'Secure' : HYP[h].short}</th>)}</tr></thead><tbody>{HYPS.map((h) => { const t = Object.values(r.matrix[h]).reduce((a, b) => a + b, 0); return <tr key={h}><th scope="row">{h === 'CORRECT' ? 'Secure' : HYP[h].short}</th>{[...HYPS, 'CHECK'].map((k) => { const v = t ? r.matrix[h][k] / t : 0; return <td key={k} class={h === k ? 'diag' : ''} style={`--v:${v}`}>{v >= 0.0005 ? (v * 100).toFixed(v < 0.095 ? 1 : 0) : '·'}</td>; })}</tr>; })}</tbody></table><p class="soft">Row percentages. {r.learners.toLocaleString('en-IN')} virtual learners. Simulation only: these are not classroom results.</p></section></>}
      <section class="card" data-t="golden"><h3>Golden vector: same input, same output, every target</h3>
        {g && <><div class="row wrap"><Tag kind={g.a.pass ? 'ok' : 'cor'}>Browser {g.a.pass ? 'identical' : 'differs'}</Tag><Tag kind={g.b.pass ? 'ok' : 'cor'}>Server service {g.b.pass ? 'identical' : 'not reached'}</Tag><Tag kind="amb">Kotlin port: next</Tag></div><div class="scrollx"><table class="gold"><thead><tr><th>Cause</th><th>Expected</th><th>This device</th></tr></thead><tbody>{HYPS.map((h) => <tr key={h}><td>{h}</td><td>{GOLDEN.output[h].toFixed(9)}</td><td>{g.a.out[h].toFixed(9)}</td></tr>)}</tbody></table></div></>}</section>
    </div>
  );
}
