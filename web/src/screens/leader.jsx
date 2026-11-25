import { useMemo, useState } from 'preact/hooks';
import { CONCEPT, HYP, runClass, MIX } from '../../../core/index.js';
import { fastForward, present } from '../lib/store.js';
import { Btn, Head, Icon, Tag } from '../ui/bits.jsx';

const near = (n) => Math.round(n / 5) * 5; // totals are rounded so hidden cells cannot be worked out
const COLS = ['bottom', 'size', 'equiv', 'common', 'opsense'];
const mixFor = (t, b, e) => ({ ...MIX, TOPS_AND_BOTTOMS: t, BIGGER_BOTTOM_BIGGER: b, ADDITIVE_EQUIV: e, CORRECT: 40 - t - b - e - 4 });
const SEC = [['6A', 11, mixFor(8, 5, 6)], ['6C', 12, mixFor(12, 4, 4)], ['7A', 13, mixFor(5, 3, 11)], ['7B', 14, mixFor(6, 2, 9)], ['8A', 15, mixFor(4, 2, 5)]];
function stuckCounts(ds) { const o = Object.fromEntries(COLS.map((c) => [c, 0])); for (const d of ds) if (d.settled && HYP[d.top].concept) o[HYP[d.top].concept]++; return o; }

export default function Leader() {
  const [sel, setSel] = useState(null);
  const rows = useMemo(() => SEC.map(([n, seed, mix]) => { const r = runClass(seed, { mix }); return { n, size: 40, c: stuckCounts(r.kids.map((k) => k.d)) }; }), []);
  const own = present.value.length ? [{ n: '6B', size: present.value.length, c: stuckCounts(present.value), live: true }] : [];
  const all = [rows[0], ...own, ...rows.slice(1)], tot = COLS.map((c) => all.reduce((s, r) => s + r.c[c], 0)), worst = COLS[tot.indexOf(Math.max(...tot))];
  return (
    <div class="page">
      <Head eyebrow="School leader" title={`“${CONCEPT[worst].name}” needs the most support across sections`}>Counts per section only. No names, no ranking of children or teachers. Cells under five learners are hidden.</Head>
      {!own.length && <div class="row"><Btn kind="ghost" onClick={() => fastForward('act')}>Add class 6B from a check</Btn></div>}
      <section class="card scrollx" data-t="heat">
        <table class="heat"><caption class="sr">Learners needing a bridge, by section and concept</caption><thead><tr><th scope="col">Section</th>{COLS.map((c) => <th scope="col" key={c} class={c === worst ? 'hotc' : ''}>{CONCEPT[c].name}</th>)}</tr></thead>
          <tbody>{all.map((r) => <tr key={r.n}><th scope="row">{r.n}{r.live && <Tag kind="ok">live</Tag>}</th>{COLS.map((c) => { const v = r.c[c], hide = v > 0 && v < 5, p = v / r.size; return <td key={c}><button class={`cell ${hide ? 'hid' : ''} ${p > 0.24 ? 'hi' : ''}`} style={`--h:${hide ? 0 : Math.min(1, p * 3)}`} aria-label={`${r.n}, ${CONCEPT[c].name}: ${hide ? 'hidden, fewer than five' : v + ' of ' + r.size}`} onClick={() => setSel({ r, c, hide, v })}>{hide ? '<5' : v}</button></td>; })}</tr>)}</tbody>
          <tfoot><tr><th scope="row">All, rounded</th>{tot.map((t, i) => <td key={i}><b>~{near(t)}</b></td>)}</tr></tfoot></table>
        <div class="legend"><span><i class="heat0" />none</span><span><i class="heat1" />some</span><span><i class="heat2" />many need a bridge</span></div>
      </section>
      <div class="two">
        <section class="card"><h3>{sel ? `${sel.r.n} · ${CONCEPT[sel.c].name}` : 'Tap a cell'}</h3><p>{!sel ? 'See what support a section could use.' : sel.hide ? 'Fewer than five learners. Hidden so nobody can be picked out.' : sel.v ? `${sel.v} of ${sel.r.size} learners need a bridge here. Suggested support: one shared strip kit and a 10-minute demo in the staff meeting.` : 'No bridge needed here.'}</p></section>
        <section class="card dark"><h3>Suggested school action</h3><p>Run one 20-minute staff huddle on “{CONCEPT[worst].name}” this week. About {near(Math.max(...tot))} learners across {all.length} sections would benefit.</p></section>
      </div>
      <p class="foot"><Icon n="eye" s={14} /> Simulated sections, run through the same engine.</p>
    </div>
  );
}
