import { useMemo, useState } from 'preact/hooks';
import { HYP, HYPS, makeAdd, eig, prior } from '../../../core/index.js';
import { stamp, toast } from '../lib/store.js';
import { sfx } from '../lib/fx.js';
import { Btn, F, Head, HC, Icon, Maths, Tag } from '../ui/bits.jsx';

// stand-in for an LLM drafter: one good draft, two that a model plausibly gets wrong
const DRAFTS = [
  { p: [2, 5, 1, 4], key: '13/20', opts: ['13/20', '3/9', '3/20', '2/20'], say: 'Draft 1' },
  { p: [1, 3, 1, 6], key: '2/9', opts: ['2/9', '3/6', '2/18', '1/18'], say: 'Draft 2' },
  { p: [1, 2, 1, 2], key: '2/2', opts: ['2/2', '2/4', '2/4', '1/4'], say: 'Draft 3' },
];
const val = (s) => { const [a, b] = s.split('/').map(Number); return a / b; };
export function autoCheck(d) {
  const r = makeAdd('DRAFT', ...d.p), out = [];
  if (!r.ok) { out.push([false, `Two rules give ${r.clash[2]}: a wrong answer would not name one cause`]); return out; }
  const right = r.item.options.find((o) => o.tags.includes('CORRECT')), exact = Math.abs(val(d.key) - val(right.label)) < 1e-9;
  out.push([exact, exact ? `Answer key ${d.key} is exact` : `Answer key says ${d.key}, exact arithmetic says ${right.label}`]);
  const miss = r.item.options.filter((o) => !d.opts.some((x) => Math.abs(val(x) - val(o.label)) < 1e-9));
  out.push([!miss.length, miss.length ? `No option for: ${miss.map((o) => HYP[o.tags[0]].short).join(', ')}` : 'Every option maps to exactly one rule']);
  return out;
}

export default function Studio() {
  const [p, setP] = useState([2, 3, 1, 4]), [di, setDi] = useState(null), [rev, setRev] = useState({}), r = useMemo(() => makeAdd('LIVE', ...p), [p.join()]);
  const set = (i, v) => { const q = [...p]; q[i] = Math.max(1, Math.min(12, v)); setP(q); sfx('tick'); };
  const fix = () => { const [a, b, c, d] = p; for (let k = 1; k < 60; k++) { const q = [a, b, ((c + k - 1) % 5) + 1, ((d + k - 1) % 10) + 2]; if (q[2] < q[3] && makeAdd('x', ...q).ok) { setP(q); sfx('good'); toast('The engine picked new numbers.'); return; } } };
  const d = di != null ? DRAFTS[di] : null, chk = d ? autoCheck(d) : null, pass = chk?.every((x) => x[0]);
  return (
    <div class="page">
      <Head eyebrow="Content studio" title="Misconceptions are code, so options write themselves">Change any number. Each wrong option is computed from a rule and tagged to its cause.</Head>
      <div class="two">
        <section class="card" data-t="rules"><div class="builder">{[[0, 1], [2, 3]].map(([t, b], k) => <><div class="fbuild" key={k}>{[t, b].map((i) => <div class="stepn" key={i}><button aria-label="less" onClick={() => set(i, p[i] - 1)}>−</button><b>{p[i]}</b><button aria-label="more" onClick={() => set(i, p[i] + 1)}>+</button></div>)}</div>{k === 0 && <span class="plus">+</span>}</>)}</div>
          {r.ok ? <div class="optlist">{['CORRECT', 'TOPS_AND_BOTTOMS', 'TOPS_ADD_BOTS_MULT', 'MULTIPLY_INSTEAD'].map((h) => { const o = r.item.options.find((x) => x.tags[0] === h); return <div class="optrow" key={h}><F v={o.label} /><span><b style={`color:${HC[h]}`}>{HYP[h].name}</b><code>{HYP[h].rule}</code></span></div>; })}<p class="soft">This question carries {eig(prior(), r.item).toFixed(2)} bits about a child Neev has not met.</p></div>
            : <div class="clash"><Tag kind="cor">Rejected</Tag><p><b>{HYP[r.clash[0]].short}</b> and <b>{HYP[r.clash[1]].short}</b> both give <F v={r.clash[2]} />. A child’s answer would not tell them apart.</p><Btn onClick={fix}>Pick new numbers</Btn></div>}
          <div class="row wrap"><Btn kind="ghost" class="sm" onClick={() => setP([1, 2, 1, 2])}>Try a clash</Btn><Btn kind="ghost" class="sm" onClick={() => setP([1, 2, 1, 3])}>The deck example</Btn></div></section>
        <section class="card dark" data-t="drafts"><h2>AI drafts, rules check, people approve</h2><p>Pick a draft. Two of these contain mistakes a language model could make.</p>
          <div class="row wrap">{DRAFTS.map((x, i) => <Btn key={i} kind={di === i ? 'go' : 'ghost'} class="sm" onClick={() => { setDi(i); stamp('studio'); }}>{x.say}</Btn>)}</div>
          {d && <><p class="draftq"><Maths s={`${d.p[0]}/${d.p[1]} + ${d.p[2]}/${d.p[3]} = ?`} /></p><ul class="checks">{chk.map(([ok, m], i) => <li key={i} class={ok ? 'ok' : 'no'}><Icon n={ok ? 'check' : 'x'} s={18} />{m}</li>)}</ul>
            {pass ? <div class="row wrap">{['Reviewer 1', 'Reviewer 2'].map((n, i) => <Btn key={n} kind={rev[di + '-' + i] ? 'mint' : 'ghost'} class="sm" onClick={() => setRev({ ...rev, [di + '-' + i]: true })}>{rev[di + '-' + i] ? 'Approved' : 'Approve'} · {n}</Btn>)}{rev[di + '-0'] && rev[di + '-1'] && <Tag kind="ok">Goes into pack fr-mr-3</Tag>}</div> : <Tag kind="cor">Stopped before it reaches a class</Tag>}</>}
          <p class="soft">Prototype note: drafts here are pre-written stand-ins for a language model. The checks are real.</p></section>
      </div>
      <section class="card"><h3>The rule library</h3><div class="rules">{HYPS.map((h) => <div key={h}><b style={`color:${HC[h]}`}>{h}</b><code>{HYP[h].rule}</code><small>{HYP[h].name}</small></div>)}</div></section>
    </div>
  );
}
