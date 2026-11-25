import { NAV } from '../app.jsx';
import { go, resetClass, resetStu, stamps, toast, isPhone, mode } from '../lib/store.js';
import { Btn, Head, Icon } from '../ui/bits.jsx';

export default function More() {
  return (
    <div class="page more">
      <button class="jurydoor" onClick={() => go('jury')}><Icon n="star" /><span><strong>For juries: guided tour</strong><small>Three minutes, the whole loop, live</small></span><Icon n="fwd" /></button>
      {NAV.map(([g, items]) => <section key={g}><h3>{g}</h3><div class="moregrid">{items.map(([id, n, ic]) => <button key={id} onClick={() => go(id)}><span class="rico"><Icon n={ic} /></span>{n}</button>)}</div></section>)}
      <div class="row wrap"><Btn kind="ghost" class="sm" onClick={() => { resetClass(); resetStu(); stamps.value = []; toast('Demo reset'); }}><Icon n="undo" s={18} /> Reset demo</Btn>{!isPhone && <Btn kind="ghost" class="sm" onClick={() => (mode.value = null)}><Icon n="phone" s={18} /> Switch device view</Btn>}</div>
    </div>
  );
}
