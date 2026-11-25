import { go, mode } from '../lib/store.js';
import { sfx } from '../lib/fx.js';
import { useTilt } from '../lib/tilt.js';
import { Eeta, Icon, Note, Tower } from '../ui/bits.jsx';

const BR = [['w', 'Whole-number operations', 'ok'], ['b', 'Fraction size sense', 'gap'], ['e', 'Equivalent fractions', 'blocked'], ['c', 'Common denominators', 'blocked'], ['a', 'Fraction addition', 'blocked'], ['r', 'Ratio and proportion', 'blocked']].map(([id, name, state]) => ({ id, name, state }));

/** Blueprint night: the plan under every building. */
export function Scene() { return <div class="scene" aria-hidden="true"><i class="aura a1" /><i class="aura a2" /><i class="aura a3" /><i class="bp" /><i class="floor" /><i class="motes" /></div>; }

export function Gate() {
  const ref = useTilt();
  const pick = (m, to) => { sfx('thud'); mode.value = m; go(to || 'home'); };
  return (
    <div class="gate" ref={ref}>
      <Scene />
      <div class="gatehead"><img src="./icon.svg" width="38" height="38" alt="" /><b>Team NEXUS</b><span class="gchip">Prasunex Innovathon 2026</span><span class="gchip">Round 3</span></div>
      <div class="gatemain">
        <div class="gatecopy">
          <h1>Neev</h1>
          <p class="tagline">Find the missing foundation.</p>
          <p class="gatelead">A wrong answer is a crack you can see. Neev finds the loose brick under it, helps fix it, and checks that it holds.</p>
          <h2>How would you like to continue?</h2>
          <div class="doors">
            <button class="door dm" onClick={() => pick('mobile')} data-t="door-mobile">
              <span class="doorart"><span class="aphone"><u /><em>1/2 + 1/3</em><i /><i class="x" /><i /><i /></span></span>
              <span class="doort"><strong>Mobile mode</strong><span>Made for students’ phones</span><small>For a better experience, open it on your phone</small></span>
              <span class="go"><Icon n="fwd" /></span>
            </button>
            <button class="door dw" onClick={() => pick('web')} data-t="door-web">
              <span class="doorart"><span class="aweb"><i /><b /><b /><b /><b /></span></span>
              <span class="doort"><strong>Web mode</strong><span>The full workspace</span><small>Best on a laptop or projector</small></span>
              <span class="go"><Icon n="fwd" /></span>
            </button>
          </div>
          <button class="jurydoor" onClick={() => pick('web', 'jury')}><Icon n="star" /><span><strong>Judging today? Take the guided tour</strong><small>Three minutes, the whole loop running live</small></span><Icon n="fwd" /></button>
        </div>
        <div class="gateart"><div class="tilt"><Tower bricks={BR} wobble w={460} /></div><Note tilt={-5}>the real problem is down here</Note><Eeta mood="wow" size={116} /></div>
      </div>
    </div>
  );
}
