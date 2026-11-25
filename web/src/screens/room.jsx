import { useEffect, useRef, useState } from 'preact/hooks';
import { CHECK, HYP, HYPS, ITEM, diagnose, eig, posterior, rankProbes, rng, virtualAnswer } from '../../../core/index.js';
import { stamp } from '../lib/store.js';
import { call, server, shareUrl } from '../lib/net.js';
import { confetti, sfx } from '../lib/fx.js';
import { Belief, Btn, Head, HC, Icon, Opt, Question, Ring, Tag } from '../ui/bits.jsx';
import { QR } from '../ui/qr.jsx';

const toAnswers = (p) => { const out = []; for (const a of p.answers) { const item = ITEM[a.item]; if (!item) continue; const probe = out.length >= 3; out.push({ item, option: a.option, side: a.side, ...(probe ? { probe, informative: eig(posterior(out), item) > 0.05 } : {}) }); } return out; };
export default function Room() {
  const [room, setRoom] = useState(null), [st, setSt] = useState(null), [bots, setBots] = useState([]), [err, setErr] = useState(null), [item, setItem] = useState(CHECK[0].id), [rev, setRev] = useState(false), n = useRef(0);
  useEffect(() => { if (!room?.code) return; const es = new EventSource(`/v1/rooms/${room.code}/live`); es.onmessage = (e) => { setSt(JSON.parse(e.data)); sfx('tick'); }; es.onerror = () => setErr('Reconnecting…'); es.onopen = () => setErr(null); return () => es.close(); }, [room?.code]);
  const open = async () => { if (server.value === 'live') { try { setRoom(await call('/rooms', { body: {} })); } catch (e) { setErr(e.message); } } else setRoom({ code: null }); stamp('room'); };
  const players = [...(st?.players || []), ...bots], cur = ITEM[st?.item || item], reveal = st ? st.reveal : rev, who = players.map((p) => ({ ...p, a: toAnswers(p) })).map((p) => ({ ...p, d: diagnose(p.a) })), answered = players.filter((p) => p.answers.some((a) => a.item === cur.id)).length;
  const answerBots = (id, list = bots) => list.map((b, i) => { if (b.answers.some((a) => a.item === id)) return b; const v = virtualAnswer(ITEM[id], b.hidden, rng(i * 97 + id.length * 13 + id.charCodeAt(id.length - 1)), 0.06, 0.15); return { ...b, answers: [...b.answers, { item: id, option: v.option, side: v.side }] }; });
  const addBots = () => { const add = HYPS.map((h, i) => ({ id: 'b' + ++n.current, name: ['Asha', 'Bilal', 'Chitra', 'Dev', 'Esha', 'Faiz'][i], bot: true, hidden: h, answers: [] })); setBots(answerBots(cur.id, [...bots, ...add])); };
  const host = async (b) => { if (room?.code) { try { await call(`/rooms/${room.code}/host`, { body: { host: room.host, ...b } }); } catch (e) { setErr(e.message); } } if (b.item) { setItem(b.item); setRev(false); setBots((x) => answerBots(b.item, x)); } if (b.reveal != null) { setRev(b.reveal); if (b.reveal) confetti(50); } };
  const idx = CHECK.findIndex((c) => c.id === cur.id), openP = who.filter((w) => w.d.open && w.a.length), used = [...new Set(players.flatMap((p) => p.answers.map((a) => a.item)))];
  const nextItem = idx >= 0 && idx < 2 ? CHECK[idx + 1].id : openP.length ? rankProbes(openP.map((w) => w.d.post), used)[0]?.item.id : null;

  if (!room) return <div class="page"><Head eyebrow="Live room" title="You are the class">Everyone in the hall opens one link. Each phone becomes a NeevCard, and Neev diagnoses the room live.</Head><section class="card dark"><h2>Ready for a room of up to 60</h2><p>{server.value === 'live' ? 'The Neev server is connected, so phones can join.' : 'No Neev server here, so phones cannot join. You can still see it with sample players.'}</p><Btn class="big" onClick={open}><Icon n="users" /> Open a room</Btn>{err && <p>{err}</p>}</section></div>;
  return (
    <div class="page room">
      <div class="roomtop"><div>{room.code ? <><QR text={shareUrl(`#/join/${room.code}`)} size={132} /></> : <Tag kind="amb">Sample players only</Tag>}</div><div><p class="eyebrow">Live room {room.code && <>· code <b class="code">{room.code}</b></>}</p><h1><Question item={cur} /></h1><div class="miniopts">{cur.options.map((o) => { const k = players.filter((p) => p.answers.some((a) => a.item === cur.id && a.option === o.key)).length; return <span key={o.key} class={reveal && o.key === cur.answer ? 'right' : ''}><b>{o.key}</b><Opt o={o} />{reveal && <em>{k} {o.tags[0] && o.tags[0] !== 'CORRECT' ? HYP[o.tags[0]].short : ''}</em>}</span>; })}</div></div></div>
      <div class="row wrap"><Tag kind="ok">{answered} of {players.length} answered</Tag><Btn onClick={() => host({ reveal: true })} disabled={reveal || !answered}>Reveal causes</Btn><Btn kind="mint" disabled={!nextItem || !answered} onClick={() => host({ item: nextItem })}>{idx >= 0 && idx < 2 ? 'Next question' : nextItem ? 'Ask the sharpest probe' : 'All settled'}</Btn><Btn kind="ghost" onClick={addBots}>Add 6 sample players</Btn>{err && <span class="soft">{err}</span>}</div>
      <div class="jurors">{who.map((w) => <div key={w.id} class={`juror ${w.answers.some((a) => a.item === cur.id) ? 'in' : ''}`}><Ring v={reveal ? w.d.p : 0} color={HC[w.d.top]} size={44}>{reveal ? Math.min(99, Math.round(w.d.p * 100)) : w.answers.length}</Ring><span><b>{w.name}</b><small>{!reveal ? (w.answers.some((a) => a.item === cur.id) ? 'answered' : 'thinking…') : w.d.settled ? (w.d.top === 'CORRECT' ? 'Secure' : HYP[w.d.top].short) : w.a.length < 3 ? 'too early to say' : 'not sure yet'}</small></span>{w.bot && <Tag>sample</Tag>}</div>)}{!players.length && <p class="soft">Waiting for the first phone…</p>}</div>
      {reveal && who.length > 0 && <section class="card"><h3>The room’s belief</h3><Belief post={Object.fromEntries(HYPS.map((h) => [h, who.reduce((s, w) => s + w.d.post[h], 0) / who.length]))} /></section>}
    </div>
  );
}
