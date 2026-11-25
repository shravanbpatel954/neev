import { useMemo, useState } from 'preact/hooks';
import { TURN } from '../../../core/cards.js';
import { isPhone, go, stamp } from '../lib/store.js';
import { shareUrl } from '../lib/net.js';
import { Btn, Head, Icon, Tag } from '../ui/bits.jsx';
import { NeevCard, cardSVG } from '../ui/neevcard.jsx';
import { Scanner } from '../ui/scanner.jsx';
import { QR } from '../ui/qr.jsx';

function print() {
  const pg = (side) => Array.from({ length: 10 }, (_, p) => `<section>${Array.from({ length: 4 }, (_, i) => { const row = Math.floor(i / 2), col = i % 2, id = p * 4 + row * 2 + (side === 'sure' ? col : 1 - col); return `<figure>${cardSVG(id, side)}<figcaption>NeevCard ${id + 1}</figcaption></figure>`; }).join('')}</section>`);
  const a = pg('sure'), b = pg('guess'), w = open('', '_blank'); if (!w) return;
  w.document.write(`<!doctype html><title>NeevCards 1 to 40</title><style>@page{size:A4;margin:10mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font:12px sans-serif}section{display:grid;grid-template-columns:1fr 1fr;gap:8mm;page-break-after:always;padding:4mm}figure{margin:0;text-align:center}svg{width:84mm;height:84mm}</style>${a.map((x, i) => x + b[i]).join('')}`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
}
export default function Cards() {
  const [id, setId] = useState(6), [opt, setOpt] = useState('A'), [side, setSide] = useState('sure'), [live, setLive] = useState(false), [seen, setSeen] = useState(null);
  const none = useMemo(() => [], []);
  return (
    <div class="page">
      <Head eyebrow="NeevCards" title="Forty answers, one sweep of the camera">Hold the card with your answer on top. Blue side if you are sure, orange if you are guessing.</Head>
      <div class="two">
        <section class="card center" data-t="card"><NeevCard id={id} side={side} turn={TURN[opt]} size={230} /><div class="gopts">{['A', 'B', 'C', 'D'].map((o) => <button key={o} class={`gopt ${opt === o ? 'yes' : ''}`} onClick={() => setOpt(o)}>{o}</button>)}</div><div class="row wrap"><button class={`side sureb ${side === 'sure' ? 'on' : ''}`} onClick={() => setSide('sure')}>Sure</button><button class={`side guessb ${side === 'guess' ? 'on' : ''}`} onClick={() => setSide('guess')}>Guessing</button></div><label class="lightr">Card number <b>{id + 1}</b><input class="range" type="range" min="0" max="39" value={id} onInput={(e) => setId(+e.currentTarget.value)} /></label><div class="row wrap"><Btn onClick={print}><Icon n="cards" /> Print all 40</Btn>{isPhone && <Btn kind="ghost" onClick={() => go('card')}>Use this phone as a card</Btn>}</div></section>
        <section class="card" data-t="trycam"><h3>Try it now with a webcam</h3>
          {live ? <><Scanner cards={none} live={live} setLive={setLive} light={1} need={3} onRead={(i, o, s) => { setSeen({ i, o, s }); stamp('card'); }} onFrame={(d) => { if (d[0]) setSeen({ i: d[0].id, o: d[0].option, s: d[0].side }); }} /><p class="seen" aria-live="polite">{seen ? <>Card <b>{seen.i + 1}</b> says <b>{seen.o}</b>, {seen.s === 'sure' ? 'sure' : 'guessing'}</> : 'Hold a card up to the camera'}</p><Btn kind="ghost" onClick={() => setLive(false)}>Stop camera</Btn></> : <><ol class="plain"><li>Scan this QR with your phone. It becomes a NeevCard.</li><li>Start the camera here and hold your phone up.</li></ol><QR text={shareUrl('#/card')} size={150} /><Btn onClick={() => setLive(true)}><Icon n="scan" /> Start camera</Btn></>}</section>
      </div>
      <section class="card"><h3>How the phone reads a card</h3><ol class="how">{[['Find', 'Dark squares stand out in an adaptive threshold, in dim or bright rooms.'], ['Decode', 'A 4 × 4 code names the learner. One misread cell is corrected.'], ['Turn', 'The rotation is the answer. The frame colour is the confidence.'], ['Confirm', 'Three matching frames before an answer counts.'], ['Forget', 'Frames live in memory only. No photo is stored or sent.']].map(([a, b], i) => <li key={a}><i>{i + 1}</i><b>{a}</b><span>{b}</span></li>)}</ol><Tag kind="ok">40 of 40 read in one test frame, bright and dim (rendered)</Tag><p class="soft">Prior art: Cross, Cutrell and Thies (UIST 2012); Plickers. New here: a confidence side, and answers that feed a diagnosis.</p></section>
    </div>
  );
}
