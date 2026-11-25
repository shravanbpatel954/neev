import { useState } from 'preact/hooks';
import { TURN } from '../../../core/cards.js';
import { go } from '../lib/store.js';
import { Icon } from '../ui/bits.jsx';
import { NeevCard } from '../ui/neevcard.jsx';

export default function CardScreen() {
  const [id, setId] = useState(() => Math.floor(Math.random() * 40)), [o, setO] = useState('A'), [s, setS] = useState('sure');
  return (
    <div class="cardscreen">
      <div class="row"><button class="iconbtn" aria-label="Back" onClick={() => go('cards')}><Icon n="back" /></button><b>Card {id + 1}</b><button class="linkbtn" onClick={() => setId((id + 1) % 40)}>Change</button></div>
      <NeevCard id={id} side={s} turn={TURN[o]} size={Math.min(300, innerWidth - 60)} />
      <div class="gopts">{['A', 'B', 'C', 'D'].map((x) => <button key={x} class={`gopt ${o === x ? 'yes' : ''}`} onClick={() => setO(x)}>{x}</button>)}</div>
      <div class="row"><button class={`side sureb ${s === 'sure' ? 'on' : ''}`} onClick={() => setS('sure')}>Sure</button><button class={`side guessb ${s === 'guess' ? 'on' : ''}`} onClick={() => setS('guess')}>Guessing</button></div>
      <p>Turn brightness up and hold your phone to the scanner.</p>
    </div>
  );
}
