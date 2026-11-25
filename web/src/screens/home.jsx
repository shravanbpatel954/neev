import { useState } from 'preact/hooks';
import { useTilt } from '../lib/tilt.js';
import { cls, go, isPhone, mode, sound, stu, tops } from '../lib/store.js';
import { calm, sfx } from '../lib/fx.js';
import { t } from '../lib/i18n.js';
import { Btn, Eeta, Icon, Maths, Say, Tower } from '../ui/bits.jsx';
import { Scene } from './gate.jsx';

const LAYERS = [
  { id: 'whole', name: 'Whole numbers', state: 'ok', say: 'Every tower starts here: adding, sharing, times tables.' },
  { id: 'bottom', name: 'What the bottom counts', state: 'gap', say: 'This is the brick most children are missing. The bottom number is the size of the piece.' },
  { id: 'equiv', name: 'Equivalent fractions', state: 'blocked', say: '2/4 and 4/8 are the same amount. It leans on the brick below.' },
  { id: 'common', name: 'Common denominators', state: 'blocked', say: 'Same-size pieces, so we can count them together.' },
  { id: 'add', name: 'Fraction addition', state: 'blocked', say: 'Here is where the wrong answer shows up. But the crack is further down.' },
];
// small living previews, drawn in CSS
const ART = {
  quest: <span class="art aq"><i /><i /><i /><i /><i /></span>,
  class: <span class="art ac">{Array.from({ length: 24 }, (_, i) => <i key={i} style={`--d:${((i * 7) % 24) * 90}ms`} class={i % 7 === 3 ? 'o' : ''} />)}</span>,
  parent: <span class="art ap"><i>Hello</i><i lang="hi">नमस्ते</i><i lang="mr">नमस्कार</i></span>,
  leader: <span class="art al">{[1, 3, 0, 1, 4, 1, 2, 0, 3, 1, 0, 2].map((v, i) => <i key={i} style={`--v:${v / 4}`} />)}</span>,
  mind: <span class="art am"><i style="--w:92%" /><i style="--w:34%" /><i style="--w:18%" /></span>,
};
const ROLES = [
  ['quest', 'I am a student', 'Play, find your loose brick, fix it', 't-amber'],
  ['class', 'I am a teacher', 'Check 40 children in one lesson', 't-mint'],
  ['mind', 'Fool the engine', 'Pretend to be a child. Neev names how you think', 't-violet'],
  ['parent', 'I am a parent', 'One kind note in your language', 't-coral'],
  ['leader', 'I lead a school', 'What every section needs', 't-blue'],
];

export function Home() {
  const tiltRef = useTilt();
  const [pick, setPick] = useState(null), mob = mode.value === 'mobile';
  const top = tops.value[0];
  return (
    <div class="home">
      <section class="hero" ref={tiltRef}>
        <Scene />
        <div class="herocopy">
          <h1>{mob ? 'Find the missing foundation' : <>Same wrong answer.<br />Three different children.</>}</h1>
          <p>{mob ? 'Tap a brick, or pick who you are.' : <>“<Maths s="1/2 + 1/3 = 2/5" />” might be a missing idea, a guess, or a slip. Marks cannot tell. Neev can.</>}</p>
          <div class="row">
            <Btn onClick={() => go('quest')} data-t="cta"><Icon n="play" /> {stu.value.phase === 'hub' ? 'Play Brick Quest' : 'Continue your quest'}</Btn>
            <Btn kind="ghost" onClick={() => go('jury')}><Icon n="star" /> Guided look for juries</Btn>
          </div>
        </div>
        <div class="herotower" data-t="tower">
          <div class="tilt"><Tower bricks={LAYERS} wobble onPick={(b) => { sfx('thud'); setPick(b); }} w={mob ? 290 : 430} /></div>
        </div>
        <div class="heroeeta">{pick ? <Say mood={pick.state === 'gap' ? 'wow' : 'happy'} size={mob ? 64 : 92}>{pick.say}</Say> : <Say size={mob ? 64 : 92}>Tap a brick. One of them is missing!</Say>}</div>
      </section>

      <section class="bento" aria-label="Choose who you are">
        {ROLES.map(([id, a, b, c]) => <button key={id} class={`tile ${c} tile-${id}`} onClick={() => { sfx('tap'); go(id); }}>{ART[id]}<span class="tt"><strong>{a}</strong><small>{b}</small></span><span class="go"><Icon n="fwd" s={18} /></span></button>)}
      </section>

      <section class="loop" aria-label="How Neev works">
        {[['Spot', 'A 3-question check. Every wrong option is a clue.'], ['Verify', 'One smart follow-up tells a slip from a gap.'], ['Trace', 'The tower shows the root brick and what it blocks.'], ['Bridge', 'A 10-minute fix, grouped by need.'], ['Recheck', 'A fresh question on Day 3 and Day 10.']].map(([a, b], i) => <div class={`move m${i}`} key={a}><i /><b>{a}</b><span>{b}</span></div>)}
      </section>
      {top && <button class="resume" onClick={() => go('board')}><Icon n="board" /><span>Class 6B: {top.stuck} of {cls.value.kids.length} need help with one brick. Open the planning board.</span><Icon n="fwd" /></button>}
      <p class="foot">Team NEXUS. Class data in this prototype is simulated and labelled. No real child’s data is used.</p>
    </div>
  );
}
