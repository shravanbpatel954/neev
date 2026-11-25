// Services layer from the Round 2 architecture: sync, diagnosis, content, insights, ERP link.
// Pure functions over a store, so the Node gateway and the in-browser demo cloud run the same code.
import { ALL_ITEMS, ENGINE, HYP, PACK, bottlenecks, ingest, makeAdd, replay, runGolden } from '../core/index.js';

export const CONSENT_MISSING = new Set(['L-6B-17', 'L-6B-31']); // ERP says: no verifiable parental consent yet
export const consentOk = (l) => !CONSENT_MISSING.has(l);

/** A check id keeps one class check apart from every other, even when sample learners share pseudonyms. */
export const validCheck = (c) => typeof c === 'string' && /^[0-9a-f-]{36}$/.test(c);

export function createServices(store) {
  const only = (section, check) => store.all().filter((e) => e.learner.startsWith(`L-${section}-`) && (!check || e.check === check));
  return {
    sync: {
      upload: (events, check) => ingest({ has: store.has, add: (e) => store.add(check ? { ...e, check } : e) }, events, consentOk),
      count: () => store.size(),
    },
    diagnosis: {
      replay: (section, check) => replay(only(section, check)),
      golden: () => ({ engine: ENGINE, ...runGolden() }),
    },
    insights: {
      board(section, check) {
        const r = replay(only(section, check)), d = Object.values(r);
        return { section, learners: d.length, settled: d.filter((x) => x.settled).length, bottlenecks: bottlenecks(d).map(({ who, ...b }) => b) };
      },
    },
    content: {
      pack: () => ({ pack: PACK, engine: ENGINE, items: ALL_ITEMS.length, rules: Object.fromEntries(Object.entries(HYP).map(([k, v]) => [k, v.rule])) }),
      check(p) {
        const n = (Array.isArray(p) ? p : []).map(Number);
        if (n.length !== 4 || n.some((x) => !Number.isInteger(x) || x < 1 || x > 99)) return { ok: false, error: 'need four whole numbers, 1 to 99' };
        return makeAdd('DRAFT', ...n);
      },
    },
    erp: { roster: (section) => Array.from({ length: 40 }, (_, i) => `L-${section}-${String(i + 1).padStart(2, '0')}`).map((id) => ({ id, consent: consentOk(id) })) },
  };
}
export function memoryStore(seed = []) {
  const m = new Map(seed.map((e) => [e.eventId, e]));
  return { has: (k) => m.has(k), add: (e) => m.set(e.eventId, e), all: () => [...m.values()], size: () => m.size };
}
