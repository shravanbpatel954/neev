import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CHECK, GROUPS, HYP, ITEM, ranked } from '../../../core/index.js';
import { cls, diag, go, groupOf, openKids, outbox, present, probeAnswer, probeRank, record, resetClass, setCls, simAnswer, stamp, toast } from '../lib/store.js';
import { confetti, sfx, buzz } from '../lib/fx.js';
import { Bar, Belief, Btn, Head, HC, Icon, Note, Opt, Question, Ring, Sheet, Tag, Maths } from '../ui/bits.jsx';
import { LiveToggle, Scanner } from '../ui/scanner.jsx';

export function KidSheet({ d, onClose }) {
  const k = d.kid;
  return (
    <Sheet title={`Why? ${k.name}`} onClose={onClose}>
      <p class="soft">On the server this is {k.id}. The name stays on this device.</p>
      <table class="evid"><caption class="sr">Answers behind the diagnosis</caption><thead><tr><th>Question</th><th>Answer</th><th>Side</th><th>Matches</th></tr></thead><tbody>
        {k.answers.map((a) => { const o = a.item.options.find((x) => x.key === a.option), tag = o.tags[0]; return <tr key={a.item.id}><td><Maths s={a.item.text} />{a.probe && <Tag kind="amb">probe</Tag>}</td><td><b>{a.option}</b> <Opt o={o} /></td><td><span class={`sidedot ${a.side}`} />{a.side === 'sure' ? 'Sure' : 'Guess'}</td><td>{tag ? (tag === 'CORRECT' ? 'Correct method' : HYP[tag].short) : 'No rule'}</td></tr>; })}
      </tbody></table>
      <h3>How likely is each cause</h3><Belief post={d.post} />
      <p class="soft">{d.settled ? `Settled: ${Math.min(99, Math.round(d.p * 100))}% or more, and ${d.evidence} answers that match the rule.` : d.handover ? 'Two probes were not enough, so this goes to you. Neev does not label a child it is unsure about.' : 'One answer is never enough. Neev needs 80% and two matching answers.'}</p>
    </Sheet>
  );
}

const Steps = ({ i }) => <ol class="stepper">{['Start', 'Scan', 'Verify', 'Act'].map((s, k) => <li key={s} class={k < i ? 'd' : k === i ? 'c' : ''} aria-current={k === i ? 'step' : undefined}><i>{k < i ? <Icon n="check" s={14} /> : k + 1}</i>{s}</li>)}</ol>;

function Scan({ item, kids, label, onDone, probe }) {
  const [live, setLive] = useState(false), [light, setLight] = useState(1), [tap, setTap] = useState(false), [left, setLeft] = useState(0), t0 = useRef(performance.now());
  const cards = useMemo(() => cls.value.kids.map((k) => { const a = kids.includes(k.i) ? (probe ? probeAnswer(k, item) : simAnswer(k, item)) : null; return { id: k.i, option: a?.option, side: a?.side }; }), [item.id]);
  const got = cls.value.kids.filter((k) => kids.includes(k.i) && k.answers.some((a) => a.item.id === item.id)), read = new Set(got.map((k) => k.i)), all = got.length === kids.length;
  useEffect(() => { if (all) { setLeft(((performance.now() - t0.current) / 1000).toFixed(1)); sfx('good'); buzz([15, 40, 15]); } }, [all]);
  const onRead = (id, option, side) => { if (!kids.includes(id)) return; const k = cls.value.kids[id]; record(id, probe ? { item, option, side, probe: true, informative: probeAnswer(k, item).informative } : { item, option, side }); };
  return (
    <div class="scanpage">
      <div class="scanq"><Tag kind="amb">{label}</Tag><h2><Question item={item} /></h2><div class="miniopts">{item.options.map((o) => <span key={o.key}><b>{o.key}</b><Opt o={o} /></span>)}</div></div>
      <div class="scangrid">
        <div data-t="scanner"><Scanner cards={cards} onRead={onRead} read={read} live={live} setLive={setLive} light={light} />
          <div class="row wrap"><LiveToggle live={live} setLive={setLive} /><Btn kind="ghost" class="sm" onClick={() => setTap(!tap)}><Icon n="users" s={18} /> Tap-in instead</Btn>{!live && <label class="lightr">Light<input class="range" type="range" min="0.3" max="1" step="0.05" value={light} onChange={(e) => setLight(+e.currentTarget.value)} /></label>}</div></div>
        <div class="rollbox"><p class="rollhead"><b>{got.length}</b> of {kids.length} read {all && <Tag kind="ok">{left > 0.2 ? `done in ${left} s` : 'done'}</Tag>}</p>
          <div class="roll">{cls.value.kids.map((k) => { const a = k.answers.find((x) => x.item.id === item.id), inn = kids.includes(k.i); return <button key={k.i} disabled={!inn} class={`desk ${a ? a.side : ''} ${!inn ? 'out' : ''}`} aria-label={`${k.name}${a ? ' answered ' + a.option : ''}`} onClick={() => tap && !a && setTap(k.i)}><span>{k.name.slice(0, 2)}</span>{a && <i>{a.option}</i>}</button>; })}</div>
          <p class="soft">Blue: sure. Orange: guessing. Frames stay in memory and are never saved.</p>
          <Btn class="wide" disabled={got.length < Math.min(1, kids.length)} onClick={onDone}>{all ? 'Continue' : `Continue with ${got.length}`}</Btn>
        </div>
      </div>
      {typeof tap === 'number' && <Sheet title={`Tap in for ${cls.value.kids[tap].name}`} onClose={() => setTap(true)}><div class="tapgrid">{item.options.map((o) => ['sure', 'guess'].map((s) => <button key={o.key + s} class={`side ${s}b`} onClick={() => { onRead(tap, o.key, s); setTap(true); }}><b>{o.key}</b> <Opt o={o} /> {s === 'sure' ? 'sure' : 'guess'}</button>))}</div></Sheet>}
    </div>
  );
}

export default function ClassCheck() {
  const c = cls.value, [kid, setKid] = useState(null), [why, setWhy] = useState(false);
  const pres = c.kids.filter((k) => k.present).map((k) => k.i), step = { start: 0, scan: 1, probe: 2, verify: 2, act: 3, done: 3 }[c.phase];
  const q1 = CHECK[0], wrong25 = present.value.filter((d) => d.kid.answers.some((a) => a.item === q1 && a.option === q1.predict.TOPS_AND_BOTTOMS));
  const toVerify = () => setCls({ phase: openKids.value.length && c.asked.length < 4 ? 'verify' : 'act' });

  return (
    <div class="page class">
      <div class="pagehead"><Head eyebrow="Teacher · in class" title="Class 6B, fractions check" /><div class="row"><Steps i={step} />{c.phase !== 'start' && <button class="iconbtn" aria-label="Restart class check" title="Restart" onClick={resetClass}><Icon n="undo" /></button>}</div></div>

      {c.phase === 'start' && (
        <div class="two"><section class="card" data-t="start"><h2>Three questions. Every wrong option is a clue.</h2>
          {CHECK.map((i, n) => <div class="qrow" key={i.id}><b>Q{n + 1}</b><Question item={i} /></div>)}
          <p class="soft">{pres.length} of 40 present, from the school roster. Works in airplane mode.</p>
          <Btn class="wide big" onClick={() => setCls({ phase: 'scan', qi: 0 })}><Icon n="scan" /> Start scan</Btn></section>
          <section class="card dark"><h2>One phone, forty children</h2><p>No student devices needed. Each child holds up a paper NeevCard.</p><ul class="ticks"><li>The marker says <b>who</b></li><li>The turn says <b>what</b></li><li>The colour says <b>how sure</b></li></ul><Btn kind="ghost" onClick={() => go('cards')}><Icon n="cards" /> See and print the cards</Btn><Note tilt={3}>try it with a real card and your webcam!</Note></section></div>
      )}
      {c.phase === 'scan' && <Scan key={c.qi} item={CHECK[c.qi]} kids={pres} label={`Question ${c.qi + 1} of 3`} onDone={() => { stamp('scan'); if (c.qi < 2) setCls({ qi: c.qi + 1 }); else toVerify(); }} />}

      {c.phase === 'verify' && (
        <div class="two">
          <section class="card" data-t="causes"><h2><b class="big">{wrong25.length}</b> chose <Maths s="2/5" /></h2><p class="soft">Why? Same answer, different children.</p><Belief post={meanPost(wrong25)} correctName="Careless slip" />
            <Btn kind="ghost" class="sm" onClick={() => setWhy(!why)}><Icon n="eye" s={18} /> {why ? 'Hide children' : 'See the answers behind this'}</Btn>
            {why && <div class="chips">{wrong25.map((d) => <button class="chip" key={d.kid.i} onClick={() => setKid(d)}><Ring v={d.p} color={HC[d.top]} size={30}>{Math.round(d.p * 100)}</Ring>{d.kid.name}</button>)}</div>}
            <p class="soft">{openKids.value.length} children are still unclear. {present.value.filter((d) => d.settled).length} settled.</p></section>
          <section class="card dark" data-t="probe"><h2>Ask the sharpest question</h2><p>Neev tried {probeRank.value.length} follow-ups. This one removes the most doubt.</p>
            {probeRank.value.slice(0, 4).map(({ item, bits }, i) => <div key={item.id} class={`prow ${i === 0 ? 'best' : ''}`}><Maths s={item.text} /><b>{bits.toFixed(2)} bits</b></div>)}
            <Btn class="wide big" onClick={() => setCls({ phase: 'probe', probeId: probeRank.value[0].item.id })}>Ask the class</Btn>
            <button class="linkbtn" onClick={() => setCls({ phase: 'act' })}>Skip and go to groups</button></section>
        </div>
      )}
      {c.phase === 'probe' && <Probe c={c} toVerify={toVerify} />}
      {(c.phase === 'act' || c.phase === 'done') && <Act setKid={setKid} />}
      {kid && <KidSheet d={diag.value[kid.kid.i]} onClose={() => setKid(null)} />}
    </div>
  );
}
function Probe({ c, toVerify }) {
  const item = ITEM[c.probeId], kids = useMemo(() => openKids.value.map((d) => d.kid.i), [c.probeId]);
  return <Scan key={item.id} item={item} kids={kids} probe label={`Probe ${c.asked.length + 1}, for ${kids.length} children`} onDone={() => { setCls({ asked: [...c.asked, item.id] }); stamp('verify'); const n = openKids.value.length; toast(n ? `${n} still unclear` : 'Every child is settled or handed to you'); setCls({ phase: n && c.asked.length + 1 < 4 ? 'verify' : 'act' }); }} />;
}
function meanPost(ds) { const out = {}; for (const h in HYP) out[h] = ds.reduce((s, d) => s + d.post[h], 0) / (ds.length || 1); return out; }

function Act({ setKid }) {
  const c = cls.value, [edit, setEdit] = useState(null), by = {};
  for (const d of present.value) (by[groupOf(d)] ??= []).push(d);
  const order = ['strips', 'roti', 'wall', 'opsort', 'check', 'moveon'].filter((g) => by[g]);
  const approve = () => { setCls({ approved: true, phase: 'done' }); confetti(); sfx('win'); stamp('act'); toast('Approved. Day 3 and Day 10 rechecks are scheduled.'); };
  const recheck = (day) => {
    const r = {}; for (const g of order) if (!['moveon', 'check'].includes(g)) { const n = by[g].length, p = day === 3 ? 0.72 : 0.86; r[g] = [Math.round(n * p), n]; }
    setCls({ rechecks: { ...c.rechecks, [day]: r }, day });
  };
  return (
    <>
      <div class="acthead"><h2>Next lesson: 10 minutes, {order.length} groups</h2><p class="soft">Neev proposes, you decide. Tap a name to see why, or move a child.</p></div>
      <div class="groups" data-t="groups">{order.map((g) => <section class={`group g-${g}`} key={g}><header><h3>{GROUPS[g].name}</h3><b>{by[g].length}</b></header><Tag>{GROUPS[g].mode}</Tag><p>{GROUPS[g].card}</p>
        <div class="chips">{by[g].map((d) => <button class="chip" key={d.kid.i} onClick={() => (edit !== null ? setEdit(d) : setKid(d))}>{d.kid.name}</button>)}</div></section>)}</div>
      <div class="actbar">
        {!c.approved ? <><Btn class="big" onClick={approve} data-t="approve"><Icon n="check" /> Approve groups</Btn><Btn kind="ghost" onClick={() => setEdit(edit === null ? false : null)}>{edit === null ? 'Edit groups' : 'Done editing'}</Btn>{edit === false && <span class="soft">Tap a child to move them.</span>}</> : (
          <section class="card wide"><h3>Recheck schedule</h3><ol class="days">{[0, 3, 10].map((d) => <li key={d} class={c.day >= d ? 'on' : ''}><i><Icon n={c.day >= d ? 'check' : 'clock'} s={18} /></i><b>{d === 0 ? 'Bridge huddle' : `Day ${d}`}</b>{c.rechecks[d] && <small>{Object.values(c.rechecks[d]).reduce((s, x) => s + x[0], 0)} of {Object.values(c.rechecks[d]).reduce((s, x) => s + x[1], 0)} transferred</small>}</li>)}</ol>
            <div class="row wrap">{c.day < 10 && <Btn kind="ghost" onClick={() => recheck(c.day < 3 ? 3 : 10)}><Icon n="clock" /> Demo: jump to Day {c.day < 3 ? 3 : 10}</Btn>}<Btn onClick={() => go('board')}><Icon n="board" /> Open planning board</Btn><Btn kind="ghost" onClick={() => go('sync')}><Icon n="sync" /> {outbox.value.length} events to sync</Btn></div>
            <p class="soft">{c.day ? 'Recheck results here are simulated, not classroom evidence. ' : ''}Groups expire after the Day 10 recheck. No child carries a label.</p></section>)}
      </div>
      {edit && <Sheet title={`Move ${edit.kid.name}`} onClose={() => setEdit(false)}><div class="movelist">{Object.keys(GROUPS).map((g) => <button key={g} class={`mv ${groupOf(edit) === g ? 'on' : ''}`} onClick={() => { const kids = c.kids.slice(); kids[edit.kid.i] = { ...kids[edit.kid.i], moved: g }; setCls({ kids }); setEdit(false); toast(`${edit.kid.name} moved to ${GROUPS[g].name}`); }}>{GROUPS[g].name}</button>)}</div></Sheet>}
    </>
  );
}
