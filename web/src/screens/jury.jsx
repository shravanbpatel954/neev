import { go, stamps } from '../lib/store.js';
import { Btn, Eeta, Head, Icon, Note } from '../ui/bits.jsx';
import { startTour, STEPS } from './tour.jsx';

const M = [
  ['mind', 'Try to fool the engine', 'Pretend to be a child with a hidden wrong idea. Neev names it.', '1 min', 'mind', 'mind'],
  ['scan', 'Scan 38 children', 'Our own card detector on a live frame. Dim the lights and watch.', '1 min', 'class', 'scan'],
  ['quest', 'Play as a student', 'Find your loose brick with X-ray on, then fix it in a game.', '2 min', 'quest', 'play'],
  ['room', 'You are the class', 'Every juror’s phone becomes a NeevCard. Live on the big screen.', '2 min', 'room', 'users'],
  ['sync', 'Break our network', 'Lose requests on purpose. Count the lost and doubled answers.', '1 min', 'sync', 'sync'],
  ['lab', 'Check our numbers', 'Hide causes in thousands of virtual learners, then read the matrix.', '30 s', 'lab', 'lab'],
  ['card', 'Hold up a real card', 'Your phone or a printout, in front of this webcam.', '1 min', 'cards', 'cards'],
  ['proof', 'Promise and proof', 'What our slides promised, what runs, and what is next.', '1 min', 'hood', 'layers'],
];
export default function Jury() {
  const n = M.filter((m) => stamps.value.includes(m[0])).length;
  return (
    <div class="page jury">
      <section class="juryhero"><div><Head eyebrow="For juries" title="Three minutes, one complete loop">The tour drives the real app. Nothing here is a video or a mock-up.</Head><div class="row wrap"><Btn class="big" onClick={() => startTour()} data-t="starttour"><Icon n="play" /> Start the guided tour</Btn><Btn kind="ghost" onClick={() => startTour(true)}><Icon n="vol" /> Play it with narration</Btn></div><p class="soft">{STEPS.length} stops. Use the arrow keys, pause any time, take over any screen.</p></div><div class="juryeeta"><Eeta size={170} mood="wow" /><Note tilt={5}>or just start poking!</Note></div></section>
      <div class="misshead"><h2>Or explore on your own</h2><span class="pill amber"><span class="minibrick" />{n} of {M.length} tried</span></div>
      <div class="missions" data-t="missions">{M.map(([id, t, d, time, to, ic]) => <button key={id} class={`mission ${stamps.value.includes(id) ? 'done' : ''}`} onClick={() => go(to)}><span class="rico"><Icon n={stamps.value.includes(id) ? 'check' : ic} s={26} /></span><span><strong>{t}</strong><small>{d}</small></span><em>{time}</em></button>)}</div>
      <section class="card facts"><h3>Four facts we designed around</h3><div class="stats"><div class="stat"><b>67.4%</b><span>of schools had internet in 2025–26, so the whole loop runs offline</span></div><div class="stat"><b>1 : 40</b><span>one phone, forty children, so paper cards</span></div><div class="stat"><b>29%</b><span>of Grade 6 could compare fractions, so we start there</span></div><div class="stat"><b>&lt; 18</b><span>is a child under DPDP Rules 2025, so privacy is designed in</span></div></div><p class="soft">UDISE+ 2025–26, PARAKH RS 2024, MeitY, as cited in our Round 2 deck.</p></section>
    </div>
  );
}
