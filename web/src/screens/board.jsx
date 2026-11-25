import { useState } from 'preact/hooks';
import { CONCEPT, CONCEPTS, GROUPS, HYP, downstream, mastery } from '../../../core/index.js';
import { cls, diag, fastForward, go, mode, openKids, present, setCls, stamp, toast, tops } from '../lib/store.js';
import { confetti } from '../lib/fx.js';
import { Btn, Head, Icon, Note, Tag } from '../ui/bits.jsx';
import { KidSheet } from './classcheck.jsx';

const MOB = { whole: [50, 4], share: [26, 15], mult: [76, 15], bottom: [22, 27], opsense: [54, 27], size: [17, 40], addlike: [48, 40], equiv: [80, 40], line: [17, 53], compare: [48, 53], common: [80, 53], addunlike: [40, 67], simple: [80, 67], ratio: [70, 80], percent: [45, 94] };
export default function Board() {
  const ready = present.value.some((d) => d.settled && d.top !== 'CORRECT') || (present.value.length > 0 && !openKids.value.length), top = tops.value[0], [sel, setSel] = useState(null), [kid, setKid] = useState(null);
  if (!ready) return <div class="page"><Head eyebrow="Teacher · at night" title="Planning board">{present.value.length ? `A check is under way: ${openKids.value.length} children are still unclear. Ask a probe to settle them.` : 'Nothing here yet. Run a class check first, or load the sample class.'}</Head><div class="row wrap"><Btn onClick={() => go('class')}><Icon n="scan" /> {present.value.length ? 'Back to the check' : 'Start a class check'}</Btn><Btn kind="ghost" onClick={() => fastForward('act')}>Load sample class 6B</Btn></div></div>;
  const id = sel ?? top?.concept, blocked = new Set(top ? downstream(top.concept) : []), by = Object.fromEntries(tops.value.map((b) => [b.concept, b]));
  const m = present.value.map((d) => mastery(d.kid.answers)), sec = {};
  for (const c of CONCEPTS) { const v = m.map((x) => x[c.id]).filter((x) => x != null); if (v.length) sec[c.id] = v.filter((x) => x >= 0.6).length / v.length; }
  const S = CONCEPT[id], bn = by[id], down = id ? downstream(id) : [], cause = bn && Object.keys(HYP).find((h) => HYP[h].concept === id);
  const mob = mode.value === 'mobile', X = (c) => (mob ? MOB[c.id][0] : c.x), Y = (c) => (mob ? MOB[c.id][1] : 6 + c.y * 0.9);
  return (
    <div class="page board">
      <Head eyebrow="Teacher · at night" title={top ? `${top.stuck} of ${present.value.length} are stuck at “${CONCEPT[top.concept].name}”` : 'No shared gap found'}>{top && `It blocks ${top.blocked} later concepts. Fix this brick first.`}</Head>
      <div class="boardgrid">
        <section class="card graphcard" data-t="graph">
          <div class={`graph ${mob ? 'v' : ''}`}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{CONCEPTS.flatMap((c) => c.pre.map((p) => { const a = CONCEPT[p], hot = top && (p === top.concept || blocked.has(p)) && blocked.has(c.id); return <path key={p + c.id} class={hot ? 'hot' : ''} d={mob ? `M${X(a)} ${Y(a)}C${X(a)} ${(Y(a) + Y(c)) / 2} ${X(c)} ${(Y(a) + Y(c)) / 2} ${X(c)} ${Y(c)}` : `M${X(a)} ${Y(a)}C${(X(a) + X(c)) / 2} ${Y(a)} ${(X(a) + X(c)) / 2} ${Y(c)} ${X(c)} ${Y(c)}`} vector-effect="non-scaling-stroke" />; }))}</svg>
            {CONCEPTS.map((c) => { const k = by[c.id] ? 'gap' : blocked.has(c.id) ? 'blk' : 'ok'; return <button key={c.id} class={`node ${k} ${id === c.id ? 'sel' : ''}`} style={`left:${X(c)}%;top:${Y(c)}%`} onClick={() => setSel(c.id)}>{c.name}{by[c.id] && <b>{by[c.id].stuck}</b>}</button>; })}
          </div>
          <div class="legend"><span><i class="ok" />Ready or not checked</span><span><i class="gap" />Needs a bridge</span><span><i class="blk" />Blocked downstream</span></div>
        </section>
        <div class="boardside">
          {top && <section class="card dark" data-t="tomorrow"><p class="eyebrow">Tomorrow · 10 minutes</p><h2>{GROUPS[HYP[Object.keys(HYP).find((h) => HYP[h].concept === top.concept)].group].name}, then Day 3 recheck</h2><p>{GROUPS[HYP[Object.keys(HYP).find((h) => HYP[h].concept === top.concept)].group].card}</p>{cls.value.approved ? <Tag kind="ok">Approved</Tag> : <div class="row wrap"><Btn onClick={() => { setCls({ approved: true, phase: 'done' }); confetti(60); stamp('act'); toast('Plan approved'); }}><Icon n="check" /> Approve</Btn><Btn kind="ghost" onClick={() => { if (cls.value.phase !== 'act') fastForward('act'); go('class'); }}>Edit groups</Btn></div>}</section>}
          <section class="card"><h3>Bricks that block the most</h3>{tops.value.map((b) => <button class={`rank ${id === b.concept ? 'on' : ''}`} key={b.concept} onClick={() => setSel(b.concept)}><span><b>{CONCEPT[b.concept].name}</b><small>{b.stuck} stuck, blocks {b.blocked}, {Math.round(b.conf * 100)}% sure</small></span><em>{b.score.toFixed(2)}</em></button>)}<p class="soft">Priority = share stuck × (1 + concepts blocked) × confidence.</p></section>
        </div>
      </div>
      {S && <section class="card"><h3>{S.name}</h3>
        {bn ? <><p>{HYP[cause].name}: <code>{HYP[cause].rule}</code></p><p class="soft">Tap a child to see the answers behind it.</p><div class="chips">{bn.who.map((i) => present.value[i]).filter(Boolean).map((d) => <button class="chip" key={d.kid.i} onClick={() => setKid(d.kid.i)}>{d.kid.name}</button>)}</div></> : <p class="soft">{sec[id] != null ? `${Math.round(sec[id] * 100)}% look secure here so far (knowledge tracing on this check).` : 'Not checked in this class yet.'}</p>}
        {down.length > 0 && <p class="soft">Leans on it: {down.map((d) => CONCEPT[d].name).join(', ')}.</p>}</section>}
      <p class="foot">Simulated class. Every number opens the answers behind it.</p>
      {kid != null && <KidSheet d={diag.value[kid]} onClose={() => setKid(null)} />}
    </div>
  );
}
