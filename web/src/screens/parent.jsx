import { useState } from 'preact/hooks';
import { HYP } from '../../../core/index.js';
import { CONSENT_MISSING } from '../../../server/services.js';
import { fastForward, lang, present, stamp, toast } from '../lib/store.js';
import { hush, speak } from '../lib/fx.js';
import { LANGS, NOTE, cname, kid, nt } from '../lib/i18n.js';
import { Btn, Head, Icon, Tag } from '../ui/bits.jsx';
import { Strip } from './games.jsx';

export default function Parent() {
  const pool = present.value.filter((d) => d.settled && d.top !== 'CORRECT').slice(0, 5), blocked = present.value.find((d) => CONSENT_MISSING.has(d.kid.id)), list = [...pool.filter((d) => d !== blocked), ...(blocked ? [blocked] : [])];
  const [id, setId] = useState(null), [ok, setOk] = useState(false), [talk, setTalk] = useState(false), d = list.find((x) => x.kid.i === id) || list[0];
  if (!pool.length) return <div class="page"><Head eyebrow="Parent" title="One kind note. One thing to try at home.">A note appears after a class check finds something to fix.</Head><div class="row wrap"><Btn onClick={() => fastForward('act')}>Load sample class 6B</Btn></div></div>;
  const no = CONSENT_MISSING.has(d.kid.id), c = HYP[d.top].concept, act = NOTE.act[c] || NOTE.act.bottom;
  const full = [nt(NOTE.strong), nt(NOTE.strongT), nt(NOTE.fixing), c ? `${cname(c)}. ${kid(d.top)}` : nt(NOTE.none), nt(NOTE.home), nt(act)].join('. ');
  const read = () => { if (talk) { hush(); setTalk(false); } else { setTalk(true); speak(full, lang.value, () => setTalk(false)); } };
  return (
    <div class="page">
      <Head eyebrow="Parent" title="One kind note. One thing to try at home.">No marks, no rank, no label. It opens from a link, with nothing to install.</Head>
      <div class="two parent">
        <article class="pnote" data-t="note" lang={lang.value}>
          {no ? <div class="held"><Icon n="eye" s={34} /><h2>Held</h2><p>The school has no verified parental consent for {d.kid.name} yet, so nothing is synced and no note can be made (DPDP Rule 10).</p></div> : <>
            <header><img src="./icon.svg" width="34" height="34" alt="" /><h2>{nt(NOTE.title, { s: d.kid.name })}</h2></header>
            <div class="langtabs" role="tablist" aria-label="Language">{LANGS.map(([k, n]) => <button key={k} role="tab" aria-selected={lang.value === k} class={lang.value === k ? 'on' : ''} onClick={() => { hush(); setTalk(false); lang.value = k; stamp('parent'); }}>{n}</button>)}</div>
            <section class="pn strong"><h3>{nt(NOTE.strong)}</h3><p>{nt(NOTE.strongT)}</p></section>
            <section class="pn fixing"><h3>{nt(NOTE.fixing)}</h3>{c ? <><p><b>{cname(c)}</b></p><p>{kid(d.top)}</p></> : <p>{nt(NOTE.none)}</p>}</section>
            <section class="pn home"><h3>{nt(NOTE.home)}</h3><p>{nt(act)}</p>{['bottom', 'common'].includes(c) && <><Strip n={1} d={2} /><Strip n={1} d={3} color="var(--mint)" /></>}</section>
            <p class="soft">{nt(NOTE.foot)}</p>
            <div class="row wrap"><Btn kind="mint" onClick={read} aria-pressed={talk}><Icon n={talk ? 'mute' : 'vol'} /> {talk ? 'Stop' : 'Listen'}</Btn>{ok && <Btn kind="ghost" onClick={() => toast('Demo: the signed link would open WhatsApp or SMS here.')}><Icon n="share" /> Send link</Btn>}</div></>}
        </article>
        <aside>
          <section class="card"><h3>Teacher preview</h3><p class="soft">Pick a learner. The last one has no consent on file.</p><div class="chips">{list.map((x) => <button key={x.kid.i} class={`chip ${x === d ? 'on' : ''}`} onClick={() => { setId(x.kid.i); setOk(false); hush(); setTalk(false); }}>{x.kid.name}{CONSENT_MISSING.has(x.kid.id) && <Tag kind="cor">no consent</Tag>}</button>)}</div>
            {!no && (ok ? <Tag kind="ok">Approved by teacher</Tag> : <Btn class="wide" onClick={() => { setOk(true); stamp('parent'); toast('Approved. The link works for 14 days.'); }}><Icon n="check" /> Approve this note</Btn>)}</section>
          <section class="card dark"><h3>Where AI stops</h3><p>AI may draft the wording. It never messages a parent unreviewed and never sees a learner’s name. Hindi and Marathi drafts wait for a reviewer.</p></section>
        </aside>
      </div>
    </div>
  );
}
