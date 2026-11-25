import { computed, effect, signal } from '@preact/signals';
import { CHECK, diagnose, eig, makeClass, posterior, rankProbes, rng, virtualAnswer, HYP, bottlenecks, makeEvent } from '../../../core/index.js';

// ---------- small persisted preferences ----------
const load = (k, d) => { try { return JSON.parse(localStorage.getItem('neev:' + k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem('neev:' + k, JSON.stringify(v)); } catch { /* private mode */ } };
function kept(k, d) { const s = signal(load(k, d)); effect(() => save(k, s.value)); return s; }

const ua = navigator.userAgent;
export const isPhone = /Android.+Mobile|iPhone|iPod|Windows Phone/i.test(ua) || (matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 600);
export const mode = signal(isPhone ? 'mobile' : (() => { try { return sessionStorage.getItem('neev:mode'); } catch { return null; } })());
effect(() => { try { if (mode.value) sessionStorage.setItem('neev:mode', mode.value); else sessionStorage.removeItem('neev:mode'); } catch { /* ignore */ } });

export const lang = kept('lang', 'en');
export const sound = kept('sound', false);
export const airplane = signal(false);
export const toastMsg = signal(null);
let tt; export function toast(m) { toastMsg.value = m; clearTimeout(tt); tt = setTimeout(() => (toastMsg.value = null), 2800); }

// ---------- router ----------
const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
export const route = signal(parse());
addEventListener('hashchange', () => (route.value = parse()));
export const go = (p) => { location.hash = '/' + p; };

// ---------- jury stamps ----------
export const stamps = kept('stamps', []);
export const stamp = (id) => { if (!stamps.value.includes(id)) stamps.value = [...stamps.value, id]; };

// ---------- the classroom (6B) ----------
const NAMES = 'Aarav Ananya Arjun Bhavna Chetan Diya Farhan Gauri Harsh Isha Jatin Kavya Kiran Lata Manav Meera Mohit Naina Nikhil Ojas Pallavi Pranav Priya Rahul Riya Rohan Sahil Sakshi Samir Sana Shreya Siddhi Soham Tanvi Tara Uday Varun Vedika Yash Zoya'.split(' ');
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 33) + c.charCodeAt(0)) >>> 0, 5381);
const SEED = 21;
export function freshClass() {
  const hidden = makeClass(SEED);
  return {
    phase: 'start', qi: 0, asked: [], probeId: null, approved: false, day: 0, rechecks: {}, scanFor: 'check', real: false,
    kids: NAMES.map((name, i) => ({ i, id: `L-6B-${String(i + 1).padStart(2, '0')}`, name, hidden: hidden[i], present: i !== 8 && i !== 29, answers: [], moved: null })),
  };
}
export const cls = signal(freshClass());
export const setCls = (p) => { cls.value = { ...cls.value, ...p }; };
export const simAnswer = (kid, item) => virtualAnswer(item, kid.hidden, rng(hash(kid.id + item.id + SEED)), 0.06, 0.1);

export const diag = computed(() => cls.value.kids.map((k) => ({ ...diagnose(k.answers), kid: k })));
export const present = computed(() => diag.value.filter((d) => d.kid.present && d.kid.answers.length));
export const openKids = computed(() => present.value.filter((d) => d.open));
export const probeRank = computed(() => (openKids.value.length ? rankProbes(openKids.value.map((d) => d.post), cls.value.asked) : []));
export const tops = computed(() => bottlenecks(present.value));
export const groupOf = (d) => d.kid.moved ?? d.group ?? 'check';

// ---------- events and outbox ----------
export const outbox = signal([]);   // pending events
export const sent = signal([]);     // acknowledged events
export function record(kidIndex, ans) {
  const c = cls.value, kids = c.kids.slice(), k = kids[kidIndex];
  if (k.answers.some((a) => a.item.id === ans.item.id)) return;
  kids[kidIndex] = { ...k, answers: [...k.answers, ans] };
  cls.value = { ...c, kids };
  outbox.value = [...outbox.value, makeEvent(k.id, ans)];
}
export function probeAnswer(kid, item) {
  const a = simAnswer(kid, item);
  return { ...a, probe: true, informative: eig(posterior(kid.answers), item) > 0.05 };
}
export function resetClass() { cls.value = freshClass(); outbox.value = []; sent.value = []; }

/** Jump the demo class to a stage (used by the jury tour and by screens opened before a check). */
export function fastForward(to) {
  const order = ['start', 'scan', 'verify', 'act', 'done'], at = order.indexOf(cls.value.phase), want = order.indexOf(to);
  if (at >= want && cls.value.phase !== 'scan') return;
  const c = cls.value, kids = c.kids.map((k) => ({ ...k, answers: [...k.answers] })), ev = [], asked = [...c.asked];
  const put = (k, a) => { if (k.answers.some((x) => x.item.id === a.item.id)) return; k.answers.push(a); ev.push(makeEvent(k.id, a)); };
  if (want >= 2) for (const k of kids) if (k.present) for (const it of CHECK) put(k, simAnswer(k, it));
  if (want >= 3) for (let n = asked.length; n < 4; n++) {
    const open = kids.filter((k) => k.present && diagnose(k.answers).open); if (!open.length) break;
    const best = rankProbes(open.map((k) => posterior(k.answers)), asked)[0].item; asked.push(best.id);
    for (const k of open) put(k, probeAnswer(k, best));
  }
  cls.value = { ...c, kids, asked, phase: to, qi: 3, approved: c.approved || to === 'done' };
  outbox.value = [...outbox.value, ...ev];
}

// ---------- the student (home quest) ----------
const freshStudent = () => ({ phase: 'hub', answers: [], cause: null, bricks: 0, games: {}, rechecks: [], day: 0, bridged: false, asked: [] });
const pack = (s) => ({ ...s, answers: s.answers.map((a) => ({ ...a, item: a.item.id })) });
import { ITEM } from '../../../core/items.js';
const unpack = (s) => { try { return { ...freshStudent(), ...s, answers: (s.answers || []).filter((a) => ITEM[a.item]).map((a) => ({ ...a, item: ITEM[a.item] })) }; } catch { return freshStudent(); } };
export const stu = signal(unpack(load('student', {})));
effect(() => save('student', pack(stu.value)));
export const setStu = (p) => { stu.value = { ...stu.value, ...p }; };
export const resetStu = () => { stu.value = freshStudent(); };
export const addBricks = (n) => setStu({ bricks: stu.value.bricks + n });
export const causeConcept = (h) => (h && HYP[h] ? HYP[h].concept : null);
