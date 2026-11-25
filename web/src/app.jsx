import { useEffect, useRef, useState } from 'preact/hooks';
import { airplane, go, isPhone, lang, mode, route, sound, stu, toastMsg } from './lib/store.js';
import { hush, sfx } from './lib/fx.js';
import { LANGS, t } from './lib/i18n.js';
import { server } from './lib/net.js';
import { Icon, Lazy, Sheet } from './ui/bits.jsx';
import { Gate } from './screens/gate.jsx';
import { Home } from './screens/home.jsx';
import { TourLayer, tour } from './screens/tour.jsx';

const L = {
  quest: () => import('./screens/quest.jsx'), class: () => import('./screens/classcheck.jsx'), board: () => import('./screens/board.jsx'),
  leader: () => import('./screens/leader.jsx'), parent: () => import('./screens/parent.jsx'), studio: () => import('./screens/studio.jsx'),
  lab: () => import('./screens/lab.jsx'), mind: () => import('./screens/mind.jsx'), sync: () => import('./screens/sync.jsx'),
  hood: () => import('./screens/hood.jsx'), cards: () => import('./screens/cards.jsx'), card: () => import('./screens/card.jsx'),
  room: () => import('./screens/room.jsx'), join: () => import('./screens/join.jsx'), jury: () => import('./screens/jury.jsx'), more: () => import('./screens/more.jsx'),
};
export const NAV = [
  ['Learn', [['quest', 'Brick Quest', 'play'], ['mind', 'Mind Reader', 'mind']]],
  ['Teach', [['class', 'Class check', 'scan'], ['board', 'Planning board', 'board'], ['cards', 'NeevCards', 'cards']]],
  ['Share', [['leader', 'School leader', 'map'], ['parent', 'Parent note', 'note']]],
  ['Prove', [['lab', 'Engine lab', 'lab'], ['sync', 'Offline sync', 'sync'], ['studio', 'Content studio', 'studio'], ['hood', 'Under the hood', 'layers']]],
];
const TABS = [['home', 'home', 'home'], ['quest', 'play', 'quest'], ['class', 'scan', 'class'], ['board', 'board', 'board'], ['more', 'more', 'more']];

function Tools() {
  return (
    <div class="tools">
      <span class="pill amber" title="Bricks you have laid"><span class="minibrick" />{stu.value.bricks}<span class="sr"> {t('bricks')}</span></span>
      <label class="langpick"><span class="sr">Language</span><Icon n="globe" s={18} /><select value={lang.value} onChange={(e) => (lang.value = e.target.value)}>{LANGS.map(([k, n]) => <option value={k} key={k}>{n}</option>)}</select></label>
      <button class={`iconbtn ${airplane.value ? 'hot' : ''}`} aria-pressed={airplane.value} aria-label="Airplane mode" title="Airplane mode" onClick={() => { airplane.value = !airplane.value; sfx('tap'); }}><Icon n={airplane.value ? 'plane' : 'wifi'} /></button>
      <button class="iconbtn" aria-pressed={sound.value} aria-label="Sound" title="Sound" onClick={() => { sound.value = !sound.value; sfx('good'); if (!sound.value) hush(); }}><Icon n={sound.value ? 'vol' : 'mute'} /></button>
    </div>
  );
}
const Logo = () => <a class="logo" href="#/home" aria-label="Neev home"><img src="./icon.svg" width="34" height="34" alt="" /><b>Neev</b></a>;

const FIND = { quest: 'game student play tower', mind: 'fool engine guess', class: 'teacher scan check probe', board: 'concept map graph', cards: 'print marker webcam', leader: 'heatmap principal', parent: 'note hindi marathi', lab: 'simulation accuracy golden', sync: 'offline network qr', studio: 'rules content ai drafts', hood: 'architecture proof slides', jury: 'tour judges', room: 'live class phones', home: 'start' };
function Palette({ close }) {
  const [q, setQ] = useState(''), [i, setI] = useState(0), box = useRef();
  useEffect(() => { const k = setTimeout(() => box.current?.focus(), 30); return () => clearTimeout(k); }, []);
  const all = [['jury', 'Jury tour', 'star'], ['home', 'Home', 'home'], ...NAV.flatMap((g) => g[1]), ['room', 'Live room', 'users']];
  const hit = all.filter(([id, n]) => (n + ' ' + FIND[id]).toLowerCase().includes(q.trim().toLowerCase()));
  const open = (id) => { close(); go(id); };
  const key = (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setI((x) => (x + (e.key === 'ArrowDown' ? 1 : -1) + hit.length) % (hit.length || 1)); } if (e.key === 'Enter' && hit[i]) open(hit[i][0]); };
  return <Sheet title="Go to" onClose={close}><input ref={box} class="palq" placeholder="Search screens" aria-label="Search screens" value={q} onInput={(e) => { setQ(e.currentTarget.value); setI(0); }} onKeyDown={key} /><div class="pal">{hit.map(([id, n, ic], k) => <button key={id} class={k === i ? 'on' : ''} onMouseEnter={() => setI(k)} onClick={() => open(id)}><Icon n={ic} />{n}</button>)}{!hit.length && <p class="soft">Nothing matches.</p>}</div></Sheet>;
}

function Shell() {
  const [pal, setPal] = useState(false);
  useEffect(() => { const k = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPal((x) => !x); } }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  const r = route.value[0] || 'home', mob = mode.value === 'mobile', ref = useRef();
  useEffect(() => { ref.current?.scrollTo(0, 0); hush(); }, [route.value.join('/')]);
  const full = r === 'card' || r === 'join';
  const screen = r === 'home' ? <Home /> : L[r] ? <Lazy key={r} load={L[r]} /> : <Home />;
  return (
    <div class={`app ${mob ? 'mobile' : 'web'} r-${r}`}>
      <a class="skip" href="#main" onClick={(e) => { e.preventDefault(); ref.current?.focus(); }}>Skip to content</a>
      {!mob && !full && (
        <nav class="rail" aria-label="Main">
          <Logo />
          <button class="juryrail" onClick={() => go('jury')} data-t="jury"><Icon n="star" /> Jury tour</button>
          {NAV.map(([g, items]) => <div class="navg" key={g}><p>{g}</p>{items.map(([id, name, ic]) => <a key={id} href={`#/${id}`} class={r === id ? 'on' : ''} aria-current={r === id ? 'page' : undefined}><Icon n={ic} />{name}</a>)}</div>)}
          <button class="switchmode" onClick={() => { mode.value = null; go('home'); }}><Icon n="phone" /> Switch device view</button>
        </nav>
      )}
      <div class="col">
        {!full && <div class="top">{mob ? <Logo /> : <span class="where">{server.value === 'live' ? <><i class="dot ok" />API server connected</> : server.value === 'demo' ? <><i class="dot" />In-browser demo cloud</> : ''}{airplane.value && <b class="air"> · Airplane mode</b>}</span>}<div class="tools">{!mob && <button class="searchbtn" onClick={() => setPal(true)}><Icon n="search" s={17} />Search<kbd>Ctrl K</kbd></button>}<Tools /></div></div>}
        <main id="main" class="view" ref={ref} tabIndex={-1}>{screen}</main>
        {mob && !full && <nav class="tabs" aria-label="Main">{TABS.map(([id, ic, k]) => <a key={id} href={`#/${id}`} class={r === id ? 'on' : ''} aria-current={r === id ? 'page' : undefined}><Icon n={ic} s={22} /><span>{t(k)}</span></a>)}</nav>}
      </div>
      {toastMsg.value && <div class="toast" role="status">{toastMsg.value}</div>}
      {pal && <Palette close={() => setPal(false)} />}
      <TourLayer />
    </div>
  );
}

export function App() {
  useEffect(() => { document.documentElement.lang = lang.value; }, [lang.value]);
  const deep = ['join', 'card'].includes(route.value[0]);
  if (!mode.value && !deep) return <Gate />;
  if (mode.value === 'mobile' && !isPhone) return (
    <div class="stage">
      <aside class="stageside">
        <img src="./icon.svg" width="54" height="54" alt="" />
        <h2>Mobile mode</h2>
        <p>This is the app exactly as a student or teacher holds it.</p>
        <button class="btn ghost" onClick={() => { mode.value = null; tour.value = null; }}><Icon n="back" /> Switch device view</button>
      </aside>
      <div class="device"><Shell /></div>
      <StageQR />
    </div>
  );
  return <Shell />;
}
function StageQR() { return <aside class="stageside right"><Lazy load={loadQR} /></aside>; }
const loadQR = () => import('./ui/openonphone.jsx');
