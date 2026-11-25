import { useEffect, useRef, useState } from 'preact/hooks';
import jsQR from 'jsqr';
import { diagnose, ITEM } from '../../../core/index.js';
import { CONSENT_MISSING } from '../../../server/services.js';
import { airplane, cls, fastForward, outbox, sent, stamp } from '../lib/store.js';
import { server, serverReplay, upload } from '../lib/net.js';
import { sfx } from '../lib/fx.js';
import { Bar, Btn, Head, Icon, Switch, Tag } from '../ui/bits.jsx';
import { matrix } from '../ui/qr.jsx';

// ----- QR relay: compact, resumable frames -----
const crush = (e) => [e.eventId.replaceAll('-', ''), e.learner.slice(2), e.item.slice(3), e.option + e.side[0], e.ts, e.probe ? (e.informative ? 2 : 1) : 0];
const grow = ([i, l, it, o, ts, p]) => ({ eventId: `${i.slice(0, 8)}-${i.slice(8, 12)}-${i.slice(12, 16)}-${i.slice(16, 20)}-${i.slice(20)}`, learner: 'L-' + l, item: 'FR-' + it, option: o[0], side: o[1] === 's' ? 'sure' : 'guess', ts, ...(p ? { probe: true, informative: p === 2 } : {}), engine: '1.3.0', pack: 'fr-mr-2' });
export function toFrames(events, per = 5) { const n = Math.ceil(events.length / per); return Array.from({ length: n }, (_, i) => `NEEV1|${i}|${n}|${JSON.stringify(events.slice(i * per, (i + 1) * per).map(crush))}`); }
export function fromFrame(s) { const m = /^NEEV1\|(\d+)\|(\d+)\|(.*)$/s.exec(s); if (!m) return null; try { return { i: +m[1], n: +m[2], events: JSON.parse(m[3]).map(grow) }; } catch { return null; } }
function draw(cv, text, scale = 4) { const m = matrix(text), s = (m.n + 8) * scale; cv.width = cv.height = s; const x = cv.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, s, s); x.fillStyle = '#000'; for (let r = 0; r < m.n; r++) for (let c = 0; c < m.n; c++) if (m.at(r, c)) x.fillRect((c + 4) * scale, (r + 4) * scale, scale, scale); return x.getImageData(0, 0, s, s); }

export default function Sync() {
  useEffect(() => { if (!cls.value.kids.some((k) => k.answers.length)) fastForward('act'); }, []);
  const [bad, setBad] = useState(45), [log, setLog] = useState([]), [busy, setBusy] = useState(false), [cmp, setCmp] = useState(null), [tot, setTot] = useState({ accepted: 0, duplicates: 0, lost: 0, held: 0 });
  const pend = outbox.value, ok = sent.value, ev = pend[0] || ok[0], total = pend.length + ok.length, [size, setSize] = useState(null);
  useEffect(() => { (async () => { const raw = JSON.stringify([...outbox.value, ...sent.value]); let zip = 0; try { zip = (await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()).byteLength; } catch { /* old browser */ } setSize({ raw: (raw.length / 1024).toFixed(0), zip: zip && (zip / 1024).toFixed(1) }); })(); }, [total]);
  const say = (m, k = '') => setLog((l) => [{ m, k, t: Date.now() + Math.random() }, ...l].slice(0, 9));

  const send = async () => {
    if (airplane.value) { say('Airplane mode: events wait safely in the outbox', 'w'); return; }
    setBusy(true); stamp('sync'); let tries = 0; const T = { ...tot };
    const sendable = () => outbox.value.filter((e) => !CONSENT_MISSING.has(e.learner));
    while (sendable().length && tries < 60) {
      tries++; const batch = sendable().slice(0, 30), dice = Math.random() * 100;
      if (dice < bad * 0.55) { T.lost++; say(`Request ${tries}: lost on the way. Will retry.`, 'w'); await wait(160); setTot({ ...T }); continue; }
      let r; try { r = await upload(batch); } catch (e) { say('Server unreachable: ' + e.message, 'w'); break; }
      T.accepted += r.accepted; T.duplicates += r.duplicates;
      if (dice < bad) { T.lost++; say(`Request ${tries}: saved, but the reply was lost. Phone will resend.`, 'w'); }
      else { const ack = new Set(r.acked); sent.value = [...sent.value, ...outbox.value.filter((e) => ack.has(e.eventId))]; outbox.value = outbox.value.filter((e) => !ack.has(e.eventId)); say(`Request ${tries}: ${r.accepted} new, ${r.duplicates} duplicates ignored`, 'g'); }
      setTot({ ...T }); sfx('tick'); await wait(140);
    }
    T.held = outbox.value.filter((e) => CONSENT_MISSING.has(e.learner)).length; if (T.held) say(`${T.held} events held on the phone: no parental consent`, 'w');
    setTot({ ...T }); setBusy(false);
    if (!sendable().length) { try { const r = await serverReplay('6B'); let n = 0, same = 0; for (const k of cls.value.kids) if (r[k.id] && k.answers.length) { n++; const d = diagnose(k.answers); if (Object.keys(d.post).every((h) => Math.abs(d.post[h] - r[k.id].post[h]) < 1e-9)) same++; } setCmp({ n, same }); } catch { /* ignore */ } }
  };
  const resend = async () => { if (airplane.value || !ok.length) return; const r = await upload(ok); setTot({ ...tot, duplicates: tot.duplicates + r.duplicates, accepted: tot.accepted + r.accepted }); say(`Sent everything again: ${r.accepted} new, ${r.duplicates} duplicates ignored`, 'g'); };
  return (
    <div class="page">
      <Head eyebrow="Offline sync" title="Append events, never overwrite">{size && total ? `This check, with every probe, is ${total} answers: ${size.raw} KB raw${size.zip ? `, ${size.zip} KB compressed` : ''}. ` : ''}It can go over 2G, or with no signal at all.</Head>
      <div class="flow" data-t="flow"><div class={`fnode ${pend.length ? 'on' : ''}`}><Icon n="phone" s={26} /><b>{pend.length}</b><small>in the phone outbox</small></div><div class={`wire ${busy ? 'run' : ''} ${airplane.value ? 'cut' : ''}`}><i /><i /><i /></div><div class={`fnode ${ok.length ? 'done' : ''}`}><Icon n="layers" s={26} /><b>{ok.length}</b><small>{server.value === 'live' ? 'on the Neev server' : 'in the demo cloud'}</small></div></div>
      <section class="card"><div class="row wrap"><Switch on={airplane.value} set={(v) => (airplane.value = v)} label="Airplane mode" /><label class="lightr">Break the network <b>{bad}%</b><input class="range" type="range" min="0" max="80" value={bad} onInput={(e) => setBad(+e.currentTarget.value)} /></label><Btn onClick={send} disabled={busy || !pend.length}><Icon n="sync" /> Sync now</Btn><Btn kind="ghost" onClick={resend} disabled={busy || !ok.length}>Send it all again</Btn></div>
        <div class="stats small"><div class="stat ok"><b>{tot.accepted}</b><span>accepted once</span></div><div class="stat"><b>{tot.duplicates}</b><span>duplicates ignored</span></div><div class="stat"><b>{tot.lost}</b><span>requests broken</span></div><div class="stat"><b>{tot.held}</b><span>held for consent</span></div></div>
        {cmp && <p class="replay"><Tag kind={cmp.same === cmp.n ? 'ok' : 'cor'}>{cmp.same} of {cmp.n} learners identical</Tag> The server replayed the events through its own copy of the engine.</p>}
        <ul class="log" aria-live="polite">{log.map((l) => <li key={l.t} class={l.k}>{l.m}</li>)}</ul></section>
      <div class="two">
        <section class="card dark"><h3>One answer, as stored</h3><pre>{ev ? JSON.stringify(ev, null, 2) : 'No events yet'}</pre><p>A pseudonym, never a name. No photo, audio or location.</p></section>
        <Relay events={pend.length ? pend : ok} />
      </div>
    </div>
  );
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function Relay({ events }) {
  const cv = useRef(), vid = useRef(), [i, setI] = useState(0), [on, setOn] = useState(false), [test, setTest] = useState(null), [rx, setRx] = useState(null), [err, setErr] = useState(null);
  const frames = events.length ? toFrames(events) : [];
  useEffect(() => { if (on && frames.length) draw(cv.current, frames[i % frames.length]); }, [on, i, events]);
  useEffect(() => { if (!on) return; const t = setInterval(() => setI((x) => x + 1), 450); return () => clearInterval(t); }, [on]);
  const self = async () => { const c = document.createElement('canvas'), got = new Map(); stamp('sync'); for (let k = 0; k < frames.length; k++) { const im = draw(c, frames[k], 3), r = jsQR(im.data, im.width, im.height), f = r && fromFrame(r.data); f?.events.forEach((e) => got.set(e.eventId, e)); setTest({ k: k + 1, n: frames.length, got: got.size }); await wait(20); } setTest({ k: frames.length, n: frames.length, got: got.size, done: events.every((e) => { const g = got.get(e.eventId); return g && g.learner === e.learner && g.item === e.item && g.option === e.option && g.side === e.side && ITEM[g.item]; }) }); };
  useEffect(() => {
    if (!rx) return; let stop = false, stream; const got = new Set(); let total = 0;
    (async () => { try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } }); if (stop) return stream.getTracks().forEach((t) => t.stop()); vid.current.srcObject = stream; await vid.current.play(); const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true }); (function tick() { if (stop) return; const v = vid.current; if (v?.videoWidth) { c.width = 640; c.height = (640 * v.videoHeight) / v.videoWidth; x.drawImage(v, 0, 0, c.width, c.height); const im = x.getImageData(0, 0, c.width, c.height), r = jsQR(im.data, c.width, c.height, { inversionAttempts: 'dontInvert' }), f = r && fromFrame(r.data); if (f) { got.add(f.i); total = f.n; setRx({ on: true, got: got.size, n: total }); } } setTimeout(tick, 90); })(); } catch { setErr('Camera not available here. The self-test uses the same reader.'); setRx(null); } })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [!!rx]);
  return (
    <section class="card" data-t="relay"><h3>No signal, ever? Carry it by QR</h3><p>The phone shows pending events as a moving QR code. A staff phone reads it and carries them to the network.</p>
      <div class="relay">{on ? <canvas ref={cv} class="relayqr" aria-label="QR relay frame" /> : rx ? <video ref={vid} class="relayqr" playsInline muted /> : <div class="relayqr empty"><Icon n="scan" s={44} /></div>}
        <div class="rcol"><Btn class="sm" disabled={!frames.length} onClick={() => { setOn(!on); setRx(null); }}>{on ? `Frame ${(i % frames.length) + 1} of ${frames.length}` : 'Show QR relay'}</Btn><Btn class="sm" kind="ghost" onClick={() => { setOn(false); setErr(null); setRx(rx ? null : { on: true, got: 0, n: 0 }); }}>{rx ? `Read ${rx.got} of ${rx.n || '?'}` : 'Read with camera'}</Btn><Btn class="sm" kind="ghost" disabled={!frames.length} onClick={self}>Self-test</Btn></div></div>
      {err && <p class="soft">{err}</p>}
      {test && <><Bar v={test.k / test.n} color="var(--leaf)" right={`${test.k}/${test.n}`} />{test.done != null && <Tag kind={test.done ? 'ok' : 'cor'}>{test.done ? `${test.got} events carried, zero lost` : `${test.got} of ${events.length} carried`}</Tag>}</>}
    </section>
  );
}
