// Guided jury tour: drives the real app, spotlights the real element.
import { signal } from '@preact/signals';
import { useEffect, useRef, useState } from 'preact/hooks';
import { CHECK, diagnose, eig, posterior, rankProbes } from '../../../core/index.js';
import { cls, fastForward, go, resetClass, route, setCls, setStu, stamp, stu } from '../lib/store.js';
import { hush, speak } from '../lib/fx.js';
import { Icon } from '../ui/bits.jsx';

export const tour = signal(null); // {i, auto, voice}
const kidAnswers = (n) => CHECK.slice(0, n).map((item) => ({ item, option: item.predict.TOPS_AND_BOTTOMS, side: 'sure' }));
export const STEPS = [
  { at: 'home', t: 'tower', ref: 'R1 · 2', h: 'A wrong answer is a crack on top', p: 'Fraction addition fails up here, but the missing brick is lower down. Marks show the crack. Neev finds the brick.' },
  { at: 'class', t: 'start', ref: 'R2 · 3', h: 'One phone, forty children', p: 'The teacher asks three questions. No student needs a device.', pre: () => { resetClass(); setCls({ phase: 'start' }); } },
  { at: 'class', t: 'scanner', ref: 'R2 · 5', h: 'The detector is real', p: 'The classroom is drawn, but every box is found by our own card reader, live, frame by frame. Try the light slider.', pre: () => { resetClass(); setCls({ phase: 'scan', qi: 0 }); }, ms: 11000 },
  { at: 'class', t: 'causes', ref: 'R1 · 8', h: 'Same answer, different children', p: 'Everyone here chose 2/5. Some add tops and bottoms. Some slipped. One answer is never enough to label a child.', pre: () => { resetClass(); fastForward('verify'); } },
  { at: 'class', t: 'probe', ref: 'R2 · 6', h: 'It picks the sharpest question', p: 'Neev scores every follow-up by the doubt it would remove, in bits, and asks only the best one.', pre: () => { if (cls.value.phase !== 'verify') { resetClass(); fastForward('verify'); } } },
  { at: 'class', t: 'groups', ref: 'R1 · 10', h: 'Ten minutes, grouped by need', p: 'Neev proposes. The teacher approves, edits or rejects. Groups expire, so no child carries a label.', pre: () => { if (!['act', 'done'].includes(cls.value.phase)) fastForward('act'); } },
  { at: 'board', t: 'graph', ref: 'R2 · 4', h: 'The brick that blocks the most', p: 'Fifteen concepts. The board ranks gaps by how many learners are stuck and how much they block.', pre: () => fastForward('act') },
  { at: 'quest', t: 'xray', alt: 'ask', ref: 'R1 · 12', h: 'The student just plays', p: 'A child sees a game with no marks. X-ray shows you what the engine believes after each answer.', pre: () => { const a = kidAnswers(3); const next = rankProbes([posterior(a)], a.map((x) => x.item.id))[0].item; setStu({ phase: 'check', cause: null, bridged: false, rechecks: [], answers: [...a].slice(0, 3), _n: next.id }); } },
  { at: 'quest', t: 'mytower', ref: 'R1 · 9', h: 'Found, then fixed', p: 'The loose brick shows itself. A short repair game matches the cause, then rechecks come on Day 3 and Day 10.', pre: () => { const a = kidAnswers(3), i = rankProbes([posterior(a)], a.map((x) => x.item.id))[0].item; a.push({ item: i, option: i.predict.TOPS_AND_BOTTOMS, side: 'sure', probe: true, informative: eig(posterior(a), i) > 0.05 }); const d = diagnose(a); setStu({ phase: 'reveal', answers: a, cause: d.settled ? d.top : 'TOPS_AND_BOTTOMS', bridged: false, rechecks: [] }); } },
  { at: 'parent', t: 'note', ref: 'R2 · 4', h: 'A note a parent can use', p: 'What is strong, what we are fixing, one thing to try at home. In English, Hindi and Marathi, and it can be read aloud.', pre: () => fastForward('act') },
  { at: 'leader', t: 'heat', ref: 'R2 · 4', h: 'A school sees patterns, not people', p: 'Counts by section. Any cell under five learners is hidden.', pre: () => fastForward('act') },
  { at: 'studio', t: 'rules', ref: 'R2 · 6', h: 'Wrong answers are computed', p: 'Change the numbers. Every option is produced by a rule, so its cause is known. Clashes are rejected.' },
  { at: 'sync', t: 'flow', ref: 'R2 · 8', h: 'Offline first, never doubled', p: 'Break the network as much as you like. Each answer is stored once, and the server’s replay must agree with the phone.', pre: () => fastForward('act') },
  { at: 'lab', t: 'stats', ref: 'R2 · 10', h: 'Measured, not claimed', p: 'We hide causes in thousands of virtual learners and score the engine. It is a simulation, and it says so.' },
  { at: 'hood', t: 'proof', ref: 'R2 · 7', h: 'Promise and proof', p: 'Our slide promises are listed with links to the working feature. What is not built yet is marked too.' },
  { at: 'mind', t: 'secrets', ref: 'Try it', h: 'Now try to fool it', p: 'Pick a secret wrong method and answer like that child. Over to you!' },
];
let before = null;
export function startTour(voice = false) { before = stu.value; tour.value = { i: 0, auto: voice, voice }; }
const move = (d) => { const t = tour.value; if (!t) return; const i = t.i + d; if (i < 0) return; if (i >= STEPS.length) { end(); return; } tour.value = { ...t, i }; };
// give the student their own progress back, unless the juror stopped on the student screen to play
const end = () => { hush(); tour.value = null; if (before && route.value[0] !== 'quest') stu.value = before; before = null; stamp('tour'); };

export function TourLayer() {
  const t = tour.value, [box, setBox] = useState(null), lay = useRef(), s = t && STEPS[t.i];
  useEffect(() => { // enter a step
    if (!t) return; setBox(null); s.pre?.(); go(s.at);
    if (!t.voice) return;
    let on = true; const k = setTimeout(() => speak(`${s.h}. ${s.p}`.replace(/(\d)\/(\d)/g, '$1 over $2'), 'en', () => on && tour.value?.i === t.i && tour.value.auto && setTimeout(() => on && move(1), 900)), 500);
    return () => { on = false; clearTimeout(k); hush(); };
  }, [t?.i, !!t, t?.voice]);
  useEffect(() => { // silent autoplay
    if (!t || !t.auto || t.voice) return; const k = setTimeout(() => move(1), s.ms || 8000); return () => clearTimeout(k);
  }, [t?.i, t?.auto, t?.voice]);
  useEffect(() => { // follow the target
    if (!t) return; let tries = 0, n = 0, hands = false; const stop = () => { hands = true; }, view = lay.current?.parentElement?.querySelector('.view'); view?.addEventListener('wheel', stop, { passive: true }); view?.addEventListener('touchmove', stop, { passive: true });
    const f = () => {
      const app = lay.current?.parentElement; if (!app) return;
      const el = app.querySelector(`[data-t="${s.t}"]`) || (s.alt && app.querySelector(`[data-t="${s.alt}"]`)); if (!el || route.value[0] !== s.at) { setBox(null); return; }
      if (!hands && tries < 4 && n++ % 6 === 2) { const v = app.querySelector('.view'), vr = v.getBoundingClientRect(), off = el.getBoundingClientRect().top - vr.top - 18; if (Math.abs(off) > 30) { tries++; v.scrollTo({ top: v.scrollTop + off, behavior: tries > 1 ? 'instant' : 'smooth' }); } }
      const a = app.getBoundingClientRect(), r = el.getBoundingClientRect(); const top = Math.max(6, r.top - a.top - 8), bottom = Math.min(a.height - 6, r.bottom - a.top + 8);
      setBox((b) => { const nb = { l: Math.max(4, r.left - a.left - 8), t: top, w: Math.min(a.width - 8, r.width + 16), h: Math.max(0, bottom - top) }; return b && Math.abs(b.l - nb.l) + Math.abs(b.t - nb.t) + Math.abs(b.w - nb.w) + Math.abs(b.h - nb.h) < 1 ? b : nb; });
    };
    const k = setInterval(f, 130); f(); return () => { clearInterval(k); view?.removeEventListener('wheel', stop); view?.removeEventListener('touchmove', stop); };
  }, [t?.i, !!t]);
  useEffect(() => { const f = (e) => { if (!tour.value || /INPUT|SELECT/.test(e.target.tagName)) return; if (e.key === 'ArrowRight') move(1); if (e.key === 'ArrowLeft') move(-1); if (e.key === 'Escape') end(); }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, []);
  if (!t) return null;
  return (
    <div class="tour" ref={lay}>
      {box && <div class="spot" style={`left:${box.l}px;top:${box.t}px;width:${box.w}px;height:${box.h}px`} />}
      <section class="tcard" role="dialog" aria-label="Jury tour">
        <div class="tprog" aria-hidden="true">{STEPS.map((_, i) => <button key={i} tabIndex={-1} class={i < t.i ? 'd' : i === t.i ? 'c' : ''} onClick={() => (tour.value = { ...t, i })} />)}</div>
        <div class="tbody"><p class="tmeta"><span>{t.i + 1} of {STEPS.length}</span><span class="ref">{s.ref}</span></p><h2 aria-live="polite">{s.h}</h2><p>{s.p}</p></div>
        <div class="tctl"><button class="iconbtn" onClick={() => move(-1)} disabled={!t.i} aria-label="Back"><Icon n="back" /></button><button class="iconbtn" aria-pressed={t.auto} aria-label={t.auto ? 'Pause autoplay' : 'Autoplay'} title="Autoplay" onClick={() => { if (t.auto) hush(); tour.value = { ...t, auto: !t.auto, voice: t.auto ? false : t.voice }; }}><Icon n={t.auto ? 'clock' : 'play'} /></button><button class={`iconbtn ${t.voice ? 'hot' : ''}`} aria-pressed={t.voice} aria-label="Narration" title="Narration" onClick={() => { hush(); tour.value = { ...t, voice: !t.voice, auto: !t.voice || t.auto }; }}><Icon n={t.voice ? 'vol' : 'mute'} /></button><button class="linkbtn" onClick={end}>Exit</button><button class="btn go" onClick={() => move(1)}>{t.i + 1 === STEPS.length ? 'Try it' : 'Next'}</button></div>
      </section>
    </div>
  );
}
