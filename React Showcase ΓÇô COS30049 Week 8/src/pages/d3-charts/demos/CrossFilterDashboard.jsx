/**
 * CrossFilterDashboard – one filter state, many views.
 * Pattern: D3 owns the <g> (inside each chart: MajorBars.jsx, WeeklyTrend.jsx).
 * This parent draws nothing with D3 – it holds the state. The filters live HERE, in the
 * closest common parent ("lifting state up"). The children only receive derived data as
 * props: the KPI tiles, the bar chart (which can also SET the major filter) and the line chart.
 * Change one filter → everything re-renders from the same slice of data, so the numbers
 * always agree. No chart talks to another chart.
 */
import { useId, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { X } from 'lucide-react';
import MajorBars from './MajorBars.jsx';
import WeeklyTrend from './WeeklyTrend.jsx';
import useTweenedNumber from './helpers/useTweenedNumber.js';
import { cohort, CAMPUSES, MAJORS } from './data/cohort.js';

const ALL = 'All';
const NO_FILTERS = { campus: ALL, year: ALL, major: ALL };
const FILTERS = [
  { key: 'campus', label: 'Campus', options: CAMPUSES, show: (v) => v },
  { key: 'year', label: 'Year level', options: ['1', '2', '3'], show: (v) => `Year ${v}` },
  { key: 'major', label: 'Major', options: MAJORS, show: (v) => v },
];

// Does a student pass every filter – except the one named in `ignore`?
const passes = (d, filters, ignore) =>
  FILTERS.every(({ key }) => key === ignore || filters[key] === ALL || String(d[key]) === filters[key]);
const weeklyAverage = (rows) => (rows.length ? d3.range(12).map((i) => d3.mean(rows, (d) => d.weekly[i])) : null);
const summarise = (rows) => ({
  count: rows.length,
  score: d3.mean(rows, (d) => d.score) ?? 0,
  pass: rows.length ? rows.filter((d) => d.score >= 50).length / rows.length : 0,
  hours: d3.mean(rows, (d) => d.hours) ?? 0,
});
const OVERALL = weeklyAverage(cohort);
const BASE = summarise(cohort);

// A stat tile whose number counts to its new value (see useTweenedNumber.js).
function Kpi({ label, value, base, format, deltaFormat = format, empty }) {
  const shown = useTweenedNumber(value);
  const delta = base === undefined ? null : value - base; // no base → no comparison line
  return (
    <div className="d3c-stat">
      <dt>{label}</dt>
      <dd>
        {empty ? '–' : format(shown)}
        {!empty && delta !== null && <small>{delta >= 0 ? '+' : '−'}{deltaFormat(Math.abs(delta))} vs all students</small>}
      </dd>
    </div>
  );
}

export default function CrossFilterDashboard() {
  const id = useId();
  const [filters, setFilters] = useState(NO_FILTERS);
  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const toggleMajor = (major) => setFilters((prev) => ({ ...prev, major: prev.major === major ? ALL : major }));

  // Everything below is DERIVED from `filters` while rendering – no effects, no copies in state.
  const filtered = useMemo(() => cohort.filter((d) => passes(d, filters)), [filters]);
  const barData = useMemo(() => {
    const rows = cohort.filter((d) => passes(d, filters, 'major')); // the bar chart ignores its own filter
    return MAJORS.map((major) => ({ major, count: rows.filter((d) => d.major === major).length }));
  }, [filters]);
  const selection = useMemo(() => weeklyAverage(filtered), [filtered]); // stable array → no needless redraws
  const stats = summarise(filtered);
  const empty = filtered.length === 0;
  const active = FILTERS.filter((f) => filters[f.key] !== ALL);
  let trendCaption = `${filtered.length} selected students vs all ${cohort.length}`;
  if (active.length === 0) trendCaption = `No filters – showing all ${cohort.length} students`;
  else if (empty) trendCaption = 'No students match these filters.';

  return (
    <div>
      <div className="viz-controls d3c-filters">
        {FILTERS.map((f) => (
          <div className="field" key={f.key}>
            <label className="label" htmlFor={`${id}-${f.key}`}>{f.label}</label>
            <select id={`${id}-${f.key}`} className="input" value={filters[f.key]} onChange={(e) => setFilter(f.key, e.target.value)}>
              <option value={ALL}>All</option>
              {f.options.map((o) => <option key={o} value={o}>{f.show(o)}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="d3c-chips" aria-live="polite">
        {active.length === 0 && <span className="small muted">No filters – showing all {cohort.length} students. Try clicking a bar.</span>}
        {active.map((f) => (
          <button key={f.key} type="button" className="d3c-chip" onClick={() => setFilter(f.key, ALL)} aria-label={`Remove filter ${f.label}: ${f.show(filters[f.key])}`}>
            {f.label}: {f.show(filters[f.key])} <X size={12} aria-hidden="true" />
          </button>
        ))}
        {active.length > 1 && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setFilters(NO_FILTERS)}>Clear all</button>
        )}
      </div>

      <dl className="d3c-stats">
        <Kpi label="Students" value={stats.count} format={(v) => Math.round(v)} />
        <Kpi label="Average score" value={stats.score} base={active.length ? BASE.score : undefined} format={(v) => v.toFixed(1)} empty={empty} />
        <Kpi label="Pass rate" value={stats.pass} base={active.length ? BASE.pass : undefined} format={d3.format('.0%')} deltaFormat={(v) => `${Math.round(v * 100)} pts`} empty={empty} />
        <Kpi label="Study hours / week" value={stats.hours} base={active.length ? BASE.hours : undefined} format={(v) => v.toFixed(1)} empty={empty} />
      </dl>

      <div className="d3c-dash">
        <figure>
          <figcaption>
            Students by major
            <small>Click a bar to filter. The bars ignore their own filter, so you can still compare majors.</small>
          </figcaption>
          <MajorBars data={barData} selected={filters.major} onToggle={toggleMajor} />
        </figure>
        <figure>
          <figcaption>
            Study hours per teaching week
            <small>{trendCaption}</small>
          </figcaption>
          {/* No filter → nothing to compare: pass null, so the blue line doesn't hide the grey one. */}
          <WeeklyTrend selection={active.length ? selection : null} overall={OVERALL} />
        </figure>
      </div>
    </div>
  );
}
