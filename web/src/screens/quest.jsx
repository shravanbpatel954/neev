import { useState } from 'preact/hooks';
import { CHECK, ITEM, RECHECK, HYP, diagnose, downstream, eig, gapState, posterior, rankProbes } from '../../../core/index.js';
import { addBricks, mode, resetStu, setStu, stamp, stu } from '../lib/store.js';
import { confetti, sayFrac, sfx, speak, buzz } from '../lib/fx.js';
import { cname, kid, t } from '../lib/i18n.js';
import { lang } from '../lib/store.js';
import { Belief, Btn, Eeta, Icon, Opt, Question, Say, Tag, Tower } from '../ui/bits.jsx';
import { GAMES, GAME_FOR } from './games.jsx';
import { Scene } from './gate.jsx';
import { tour } from './tour.jsx';

const FLOORS = ['whole', 'bottom', 'size', 'equiv', 'common', 'opsense', 'addunlike'];
function towerFor(s) {
  const gap = s.cause && s.cause !== 'CORRECT' && s.cause !== 'CHECK' ? HYP[s.cause].concept : null, st = gapState(s.rechecks), below = gap ? FLOORS.indexOf(gap) : -1;
  return FLOORS.map((id, i) => ({ id, name: cname(id), state: !s.cause ? 'idle' : !gap ? 'ok' : id === gap ? (s.bridged || st !== 'open' ? 'fixed' : 'gap') : i > below && !s.bridged && downstream(gap).includes(id) ? 'blocked' : 'ok' }));
}

/** One question: choose, then flip the card to say how sure you are. */
export function Ask({ item, onAnswer, n, of, hint }) {
  const [opt, setOpt] = useState(null);
  return (
    <div class="ask" key={item.id}>
      {of && <div class="wallbar" aria-label={`Question ${n} of ${of}`}>{Array.from({ length: of }, (_, i) => <i key={i} class={i < n - 1 ? 'd' : i === n - 1 ? 'c' : ''} />)}</div>}
      <div class="qcard"><button class="speakbtn iconbtn" aria-label="Read aloud" onClick={() => speak(item.type === 'CMP' ? t('bigger', { a: `${item.p[0]}/${item.p[1]}`, b: `${item.p[2]}/${item.p[3]}` }) : sayFrac(item.text), lang.value)}><Icon n="vol" /></button><Question item={item} /></div>
      {hint}
      <div class={`opts ${opt ? 'chosen' : ''}`}>{item.options.map((o) => <button key={o.key} class={`opt o${o.key} ${opt === o.key ? 'sel' : ''}`} aria-pressed={opt === o.key} onClick={() => { setOpt(o.key); sfx('tap'); buzz(8); }}><span class="letter">{o.key}</span><Opt o={o} /></button>)}</div>
      <div class={`flip ${opt ? 'show' : ''}`} aria-hidden={!opt}>
        <p>{t('how')}</p>
        <div class="flipbtns"><button class="side sureb" disabled={!opt} onClick={() => { sfx('tick'); buzz(15); onAnswer(opt, 'sure'); }}><span class="minicard" />{t('sure')}</button><button class="side guessb" disabled={!opt} onClick={() => { sfx('tick'); buzz(15); onAnswer(opt, 'guess'); }}><span class="minicard" />{t('guess')}</button></div>
      </div>
    </div>
  );
}
export function XRay({ answers, title = 'X-ray: what the engine thinks' }) {
  const d = diagnose(answers), r = answers.length >= 3 ? rankProbes([d.post], answers.map((a) => a.item.id))[0] : null;
  return (
    <aside class="xray" data-t="xray">
      <p class="xt"><Icon n="eye" s={16} /> {title}</p>
      <Belief post={d.post} />
      <p class="xs">{!answers.length ? 'Starting belief, before any answer.' : d.settled ? <>Settled: {Math.min(99, Math.round(d.p * 100))}% sure and {d.evidence} matching answers.</> : d.handover ? 'Not sure after two probes. A teacher decides.' : <>Not settled. Needs 80% <b>and</b> 2 matching answers (now {d.evidence}).</>}</p>
      {r && d.open && <p class="xs">Sharpest next question: <b>{r.item.text}</b> ({r.bits.toFixed(2)} bits)</p>}
    </aside>
  );
}

export default function Quest() {
  const s = stu.value, mob = mode.value === 'mobile', [xr, setXr] = useState(!mob || !!tour.value), [play, setPlay] = useState(null), [rk, setRk] = useState(null);
  const seq = s.answers.length < 3 ? CHECK[s.answers.length] : rankProbes([posterior(s.answers)], s.answers.map((a) => a.item.id))[0].item;
  const st = gapState(s.rechecks), gapC = s.cause && HYP[s.cause]?.concept;

  if (play) {
    const G = GAMES[play.id];
    return <div class="questpage"><Scene /><div class="qtop"><button class="iconbtn" aria-label="Back" onClick={() => setPlay(null)}><Icon n="back" /></button><b>{G.name}</b></div><G.C intro={play.id === 'strip'} onDone={() => {
      confetti(); buzz([20, 50, 20, 50, 60]); const first = !s.games[play.id];
      setStu({ games: { ...s.games, [play.id]: (s.games[play.id] || 0) + 1 }, ...(play.bridge ? { bridged: true, phase: 'bridged' } : {}) });
      if (first || play.bridge) addBricks(3); stamp('quest'); setPlay(null);
    }} /></div>;
  }

  const answer = (option, side) => {
    const item = seq, probe = s.answers.length >= 3, a = { item, option, side, ...(probe ? { probe, informative: eig(posterior(s.answers), item) > 0.05 } : {}) };
    const answers = [...s.answers, a], d = diagnose(answers);
    if (answers.length < 3) { setStu({ answers }); return; }
    if (d.open && answers.length < 7) { setStu({ answers }); return; }
    const cause = d.settled ? d.top : 'CHECK';
    setStu({ answers, cause, phase: 'reveal', rechecks: [], bridged: false, day: 0 }); addBricks(1);
    if (cause === 'CORRECT') { sfx('win'); confetti(); } else { sfx('thud'); buzz([40, 30, 80]); }
  };

  if (s.phase === 'check') return (
    <div class={`questpage ${xr ? 'split' : ''}`}><Scene />
      <div class="qtop"><button class="iconbtn" aria-label="Leave check" onClick={() => setStu({ phase: 'hub', answers: [] })}><Icon n="x" /></button><b>{s.answers.length < 3 ? 'Spot' : 'Verify'}</b><button class={`xbtn ${xr ? 'on' : ''}`} aria-pressed={xr} onClick={() => setXr(!xr)}><Icon n="eye" s={16} /> X-ray</button></div>
      <div class="qmain">
        <div class="qleft" data-t="ask"><Ask key={seq.id} item={seq} n={s.answers.length + 1} of={Math.max(3, s.answers.length + 1)} onAnswer={answer} /><Say mood={s.answers.length >= 3 ? 'think' : 'happy'} size={mob ? 62 : 84}>{s.answers.length >= 3 ? 'Just one more, so I really understand how you think.' : t('noscore')}</Say></div>
        {xr && <XRay answers={s.answers} />}
      </div>
    </div>
  );

  if (rk) return (
    <div class="questpage"><Scene /><div class="qtop"><button class="iconbtn" aria-label="Back" onClick={() => setRk(null)}><Icon n="x" /></button><b>{t(rk.day === 3 ? 'day3' : 'day10')}</b></div>
      <div class="qmain"><div class="qleft"><Ask item={rk.item} onAnswer={(o) => { const ok = o === rk.item.answer, list = [...s.rechecks, { day: rk.day, ok }]; setStu({ rechecks: list, day: rk.day, ...(ok ? {} : { bridged: false, phase: 'reveal' }) }); addBricks(ok ? 2 : 1); if (ok) { confetti(gapState(list) === 'closed' ? 160 : 70); sfx('win'); } else { sfx('think'); } setRk(null); }} /><Say>New numbers, same idea. Show me it stuck!</Say></div></div>
    </div>
  );

  const reveal = s.phase === 'reveal' || s.phase === 'bridged', isGap = gapC && s.cause !== 'CORRECT';
  const nextDay = s.rechecks.filter((r) => r.ok).length === 0 ? 3 : 10;
  return (
    <div class="questpage hub"><Scene />
      <div class="hubgrid">
        <div class="hubtower" data-t="mytower"><Tower vivid bricks={towerFor(s)} wobble={isGap && !s.bridged} w={mob ? 300 : 420} /></div>
        <div class="hubside">
          {!reveal && <><Say size={mob ? 78 : 108}>{t('hi')}</Say><Btn class="big" data-t="startcheck" onClick={() => { setStu({ phase: 'check', answers: [], cause: null }); }}><Icon n="play" /> {t('start')}</Btn><p class="soft">{t('noscore')}</p></>}
          {s.phase === 'reveal' && s.cause === 'CORRECT' && <><Say mood="wow" size={96}>{t('solid')} {s.answers.some((a) => a.option !== a.item.answer) ? 'One answer looked like a slip. Nothing to fix!' : ''}</Say><Btn onClick={resetStu}>{t('again')}</Btn></>}
          {s.phase === 'reveal' && s.cause === 'CHECK' && <><Say mood="think" size={96}>{t('unsure')}</Say><Btn onClick={resetStu}>{t('again')}</Btn></>}
          {s.phase === 'reveal' && isGap && <div class="reveal"><h2>{t('found')}</h2><p class="gapname">{cname(gapC)}</p><Say mood="wow" size={84}>{kid(s.cause)}</Say><p class="soft">{downstream(gapC).length} ideas above lean on it.</p><Btn class="big" onClick={() => setPlay({ id: GAME_FOR[s.cause], bridge: true })}><Icon n="bolt" /> {t('fix')}</Btn></div>}
          {s.phase === 'bridged' && <div class="reveal"><h2>{st === 'closed' ? t('closed') + '!' : t('fixed')}</h2>
            <ol class="days">{[[0, 'Bridge'], [3, t('day3')], [10, t('day10')]].map(([d, l], i) => { const on = i === 0 || s.rechecks.filter((r) => r.ok).length >= i; return <li key={d} class={on ? 'on' : ''}><i>{on ? <Icon n="check" s={18} /> : <Icon n="clock" s={18} />}</i><b>{l}</b></li>; })}</ol>
            <Tag kind={st === 'closed' ? 'ok' : st === 'closing' ? 'amb' : 'cor'}>{t(st)}</Tag>
            {st === 'closed' ? <><Say mood="wow">{t('solid')}</Say><Btn onClick={resetStu}>{t('again')}</Btn></> : <><Say>A fixed brick needs time to set. I will ask again on Day {nextDay}.</Say><Btn kind="ghost" onClick={() => { const list = RECHECK[gapC]; setRk({ day: nextDay, item: ITEM[list[nextDay === 3 ? 0 : 1]] }); }}><Icon n="clock" /> Demo: jump to Day {nextDay}</Btn></>}
          </div>}
        </div>
      </div>
      <section class="arcade"><h2>Builder’s yard</h2><div class="agrid">{Object.entries(GAMES).map(([id, g]) => <button key={id} class={`acard ${g.col}`} onClick={() => { sfx('tap'); setPlay({ id }); }}><span class="rico"><Icon n={g.ic} s={24} /></span><strong>{g.name}</strong><small>{g.say}</small><span class="astars" aria-label={`${Math.min(3, s.games[id] || 0)} of 3 stars`}>{[1, 2, 3].map((k) => <i key={k} class={(s.games[id] || 0) >= k ? 'on' : ''} />)}</span></button>)}</div><p class="soft">Nothing you play here is marked or ranked. It stays on this phone.</p></section>
    </div>
  );
}
