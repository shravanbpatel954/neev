import { useState } from 'preact/hooks';
import { go, stamp } from '../lib/store.js';
import { server } from '../lib/net.js';
import { Head, Icon, Tag } from '../ui/bits.jsx';

// s: live = works in this build, sim = works on simulated data, next = designed, not in this build
const A = [
  ['Clients', [['Teacher phone app', 'Class check, scanner, tap-in, groups. Built as an installable web app (PWA) so any phone can open it; Kotlin and Compose stay the production plan.', 'live', 'class'], ['Web platform', 'Planning board, leader view, content studio, labs. One codebase, two layouts.', 'live', 'board'], ['Student and parent', 'Brick Quest and the three-language note.', 'live', 'quest']]],
  ['Edge', [['API gateway', 'Node gateway: signed 15-minute tokens, role checks, rate limits, audit log. Single sign-on with Prasunex portals is next.', 'live', 'sync']]],
  ['Services', [['Sync', 'Events in, idempotent by UUIDv7.', 'live', 'sync'], ['Diagnosis', 'neev-core: rules, Bayes, information gain. The same file runs in browser and server.', 'live', 'lab'], ['Content', 'Rule engine, clash check, two reviewers.', 'live', 'studio'], ['Insights', 'Section × concept counts, small cells hidden.', 'sim', 'leader'], ['ERP link', 'Roster and consent flags come from a sample file.', 'sim', 'class'], ['AI assist', 'Drafts only. Pre-written stand-ins here; the checks are real.', 'sim', 'studio']]],
  ['Data', [['Event log', 'Append-only file on the server, memory in the demo cloud. PostgreSQL 16 with row-level security is next.', 'live', 'sync'], ['Redis', 'Queues and cache.', 'next'], ['Object storage', 'Signed content packs.', 'next'], ['India-region cloud', 'Deployment target.', 'next']]],
];
const P = [
  ['R1 · 6', 'Five moves: spot, verify, trace, bridge, recheck', 'live', 'quest'], ['R1 · 7', 'Every wrong option is a clue; three languages', 'live', 'studio'], ['R1 · 8', 'One smart follow-up, picked by information gain', 'live', 'mind'], ['R1 · 9', 'Concept graph and bottleneck', 'live', 'board'], ['R1 · 10', 'Three bridge types, Day 3 and Day 10', 'live', 'quest'],
  ['R2 · 3', 'Start, scan, verify, act, all in airplane mode', 'live', 'class'], ['R2 · 4', 'Planning board, leader view, parent note, studio', 'live', 'board'], ['R2 · 5', 'NeevCards: who, what, how sure, three matching frames', 'live', 'cards'], ['R2 · 6', 'Rules as code, Bayes, 80% stop line', 'live', 'lab'], ['R2 · 7', 'One core, several targets, golden tests', 'live', 'lab'], ['R2 · 8', 'Idempotent events, server replay, QR relay', 'live', 'sync'], ['R2 · 9', 'Consent gate, pseudonyms, AI never decides', 'live', 'parent'], ['R2 · 10', 'Simulated class of 40 with hidden causes', 'live', 'lab'],
  ['R2 · 5', '40 printed cards in a real classroom', 'next', 'cards'], ['R2 · 7', 'Native Android app and Kotlin build of the core', 'next'], ['R2 · 9', 'Encrypted phone database, live ERP, Bhashini', 'next'],
];
const N = { live: ['ok', 'Working here'], sim: ['amb', 'Sample data'], next: ['', 'Next'] };
export default function Hood() {
  const [sel, setSel] = useState(null);
  return (
    <div class="page">
      <Head eyebrow="Under the hood" title="The Round 2 architecture, box by box">Tap any box. We mark what works in this build, what runs on sample data, and what comes next.</Head>
      <section class="arch" data-t="arch">{A.map(([n, b]) => <div class="layer" key={n}><h3>{n}</h3><div>{b.map(([t, d, s, to]) => <button key={t} class={`abox ${s} ${sel?.t === t ? 'on' : ''}`} onClick={() => setSel({ t, d, s, to })}><i class={s} />{t}</button>)}</div></div>)}
        <p class="archinfo" aria-live="polite">{sel ? <><b>{sel.t}.</b> {sel.d} {sel.to && <button class="linkbtn" onClick={() => go(sel.to)}>See it run</button>}</> : server.value === 'live' ? 'The Node gateway is connected. Uploads go to its event log.' : 'No server found, so the same service code is running inside this page.'}</p></section>
      <section class="card" data-t="proof"><h2>Promise and proof</h2><p class="soft">What our slides promised, and where each thing stands today. Open it and check.</p><div class="proof">{P.map(([ref, t, s, to], i) => <div class="pline" key={i}><span class="ref">{ref}</span><span>{t}</span><Tag kind={N[s][0]}>{N[s][1]}</Tag>{to && s !== 'next' ? <button class="linkbtn" onClick={() => { stamp('proof'); go(to); }}>Open <Icon n="fwd" s={14} /></button> : <span />}</div>)}</div></section>
      <section class="card"><h3>Built on</h3><p class="soft">ASER 2024; PARAKH Rashtriya Sarvekshan 2024; UDISE+ 2025–26; J-PAL, Teaching at the Right Level; Brown and Burton, BUGGY (1978); Cross, Cutrell and Thies, UIST 2012 (paper cards); Foster, Woodhead, Barton and Clark-Wilson (2022), students’ confidence on diagnostic questions; Carpenter, Pan and Butler (2022), spacing and retrieval; UNESCO guidance on generative AI (2023).</p></section>
    </div>
  );
}
