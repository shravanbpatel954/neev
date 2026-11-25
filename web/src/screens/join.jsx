import { useEffect, useState } from 'preact/hooks';
import { ITEM } from '../../../core/items.js';
import { go, route } from '../lib/store.js';
import { call } from '../lib/net.js';
import { buzz } from '../lib/fx.js';
import { Btn, Eeta, Say } from '../ui/bits.jsx';
import { Ask } from './quest.jsx';

export default function Join() {
  const code = (route.value[1] || '').replace(/\D/g, '').slice(0, 4), [name, setName] = useState(''), [c, setC] = useState(code), [me, setMe] = useState(null), [st, setSt] = useState(null), [err, setErr] = useState(null), [mine, setMine] = useState({});
  useEffect(() => { if (!me) return; const es = new EventSource(`/v1/rooms/${c}/live`); es.onmessage = (e) => setSt(JSON.parse(e.data)); return () => es.close(); }, [me]);
  const join = async (e) => { e.preventDefault(); setErr(null); try { const r = await call(`/rooms/${c}/join`, { body: { name } }); setMe(r); buzz(30); } catch (x) { setErr(x.status === 404 ? 'No room with that code.' : 'Could not reach the room.'); } };
  if (!me) return <form class="joinpage" onSubmit={join}><Eeta size={120} /><h1>Join the class</h1><label>Room code<input inputMode="numeric" maxLength={4} value={c} onInput={(e) => setC(e.currentTarget.value)} required /></label><label>Nickname<input maxLength={16} value={name} onInput={(e) => setName(e.currentTarget.value)} placeholder="Any fun name" autoComplete="off" /></label><Btn class="big" type="submit">Join</Btn>{err && <p role="alert">{err}</p>}<button type="button" class="linkbtn" onClick={() => go('home')}>Open Neev instead</button></form>;
  const item = st && ITEM[st.item];
  if (!item) return <div class="joinpage"><Eeta size={120} mood="think" /></div>;
  const done = mine[item.id];
  return <div class="joinpage play">{done || !st.open ? <Say mood={st.reveal ? 'wow' : 'happy'} size={110}>{st.reveal ? <>Look at the big screen! {done && <>You said {done}.</>}</> : 'Got it. Watch the big screen.'}</Say> : <Ask key={item.id} item={item} onAnswer={async (option, side) => { setMine({ ...mine, [item.id]: option }); buzz([15, 30, 15]); try { await call(`/rooms/${c}/answer`, { body: { player: me.player, option, side } }); } catch { setMine((m) => ({ ...m, [item.id]: undefined })); } }} />}</div>;
}
