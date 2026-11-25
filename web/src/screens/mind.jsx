import { useState } from 'preact/hooks';
import { CHECK, HYP, HYPS, diagnose, eig, posterior, rankProbes } from '../../../core/index.js';
import { go, mode, stamp } from '../lib/store.js';
import { confetti, sfx } from '../lib/fx.js';
import { Btn, Eeta, Head, Icon, Maths, Say } from '../ui/bits.jsx';
import { Ask, XRay } from './quest.jsx';

const SECRET = {
  CORRECT: ['The secure one', 'Answer everything the right way.'],
  TOPS_AND_BOTTOMS: ['The top-and-bottom adder', 'Add the tops, add the bottoms. 1/2 + 1/3 is 2/5.'],
  TOPS_ADD_BOTS_MULT: ['The bottom multiplier', 'Add the tops, multiply the bottoms. 1/2 + 1/3 is 2/6.'],
  MULTIPLY_INSTEAD: ['The multiplier', 'Multiply tops and bottoms. 1/2 + 1/3 is 1/6.'],
  BIGGER_BOTTOM_BIGGER: ['The big-bottom believer', 'A bigger bottom number is always the bigger fraction.'],
  ADDITIVE_EQUIV: ['The add-to-match one', 'To change the bottom, add the same to the top. 2/4 is 6/8.'],
};
export default function Mind() {
  const [st, setSt] = useState('pick'), [me, setMe] = useState(null), [ans, setAns] = useState([]), [help, setHelp] = useState(false), mob = mode.value === 'mobile';
  const d = diagnose(ans), item = ans.length < 3 ? CHECK[ans.length] : rankProbes([posterior(ans)], ans.map((a) => a.item.id))[0].item;
  const answer = (option, side) => {
    const a = { item, option, side, ...(ans.length >= 3 ? { probe: true, informative: eig(posterior(ans), item) > 0.05 } : {}) }, next = [...ans, a], nd = diagnose(next);
    setAns(next); setHelp(false);
    if (next.length >= 3 && (!nd.open || next.length >= 7)) { setSt('reveal'); stamp('mind'); if (nd.label === me) { confetti(120); sfx('win'); } else sfx('think'); }
  };
  const reset = () => { setSt('pick'); setMe(null); setAns([]); };
  if (st === 'pick') return (
    <div class="page mind"><Head eyebrow="Mind Reader" title="Pretend to be a child. Neev will work out how you think.">Pick a secret. Neev cannot see it. Then answer the way that child would.</Head>
      <div class="secrets" data-t="secrets">{HYPS.map((h, i) => <button key={h} class="secret" style={`--i:${i}`} onClick={() => { setMe(h); setSt('play'); sfx('thud'); }}><span class="sback"><Eeta size={54} mood={['happy', 'oops', 'think', 'wow', 'happy', 'think'][i]} /></span><strong>{SECRET[h][0]}</strong><small>{SECRET[h][1]}</small></button>)}</div></div>
  );
  if (st === 'play') return (
    <div class="questpage split"><div class="qtop"><button class="iconbtn" aria-label="Start over" onClick={reset}><Icon n="x" /></button><b>{SECRET[me][0]}</b><button class="xbtn" onClick={() => setHelp(!help)}><Icon n="eye" s={16} /> Remind me</button></div>
      <div class="qmain"><div class="qleft"><Ask key={item.id} item={item} n={ans.length + 1} of={Math.max(3, ans.length + 1)} onAnswer={answer} hint={help && <p class="hint">{SECRET[me][1]} So this child picks <b>{item.predict[me]}</b>.</p>} /></div><XRay answers={ans} title="Neev’s live guess" /></div></div>
  );
  const hit = d.label === me, right = SECRET[d.top];
  return (
    <div class="page mind center"><Eeta size={150} mood={hit ? 'wow' : 'think'} />
      {d.settled ? <><h1 class="mt">You are “{right[0]}”</h1><p class="lead">{(d.p * 100).toFixed(1)}% sure after {ans.length} questions. {hit ? 'That was your secret.' : `Your secret was “${SECRET[me][0]}”. Your answers fitted another rule better.`}</p></> : <><h1 class="mt">I am not sure, so I will not label you</h1><p class="lead">Best guess “{right[0]}” at {(d.p * 100).toFixed(0)}%. In class this child goes to the teacher. Your secret was “{SECRET[me][0]}”.</p></>}
      <div class="trail">{ans.map((a, i) => { const p = diagnose(ans.slice(0, i + 1)); return <div key={i}><Maths s={a.item.text} /><b>{a.option}</b><small>{p.top === 'CORRECT' ? 'Secure' : HYP[p.top].short} {Math.min(99, Math.round(p.p * 100))}%</small></div>; })}</div>
      <div class="row wrap"><Btn onClick={reset}><Icon n="undo" /> Try to fool it again</Btn><Btn kind="ghost" onClick={() => go('lab')}>See it tested on thousands</Btn></div></div>
  );
}
