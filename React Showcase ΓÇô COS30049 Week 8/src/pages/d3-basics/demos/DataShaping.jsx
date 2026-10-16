/**
 * DataShaping – d3-fetch + d3-array.
 * Pattern: D3 calculates, React renders.
 *
 * 1. d3.csv(url, d3.autoType) downloads a CSV (public/data/d3-basics/enrolments.csv)
 *    and parses it into an array of objects. autoType turns "2024" into 2024.
 * 2. d3-array reshapes it: group, rollup, flatRollup, bin, extent, mean, median, deviation.
 * The request is an effect with loading + error states and an AbortController.
 */
import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { TotalsChart, Histogram } from './ShapingCharts.jsx';

const GOOD_URL = '/data/d3-basics/enrolments.csv';
const TYPO_URL = '/data/d3-basics/enrolment.csv'; // one letter missing – a classic bug
const COLUMNS = ['year', 'campus', 'major', 'level', 'students'];
const KEYS = ['campus', 'major', 'level', 'year'];
const students = (d) => d.students; // the "accessor" every d3-array function below uses
const fmt = d3.format(',.1f');

/** A promise that resolves after ms – or rejects straight away when the request is aborted. */
function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

export default function DataShaping() {
  const [url, setUrl] = useState(GOOD_URL);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0); // bump to reload
  const [request, setRequest] = useState({ status: 'loading', rows: null, error: null });
  const [key, setKey] = useState('campus');
  const [binCount, setBinCount] = useState(8);

  useEffect(() => {
    const controller = new AbortController();
    setRequest({ status: 'loading', rows: null, error: null });
    (async () => {
      try {
        if (slow) await wait(1500, controller.signal);
        const rows = await d3.csv(url, { signal: controller.signal }, d3.autoType);
        // A wrong path often returns index.html with status 200 – so check the columns!
        if (!COLUMNS.every((c) => rows.columns.includes(c))) {
          throw new Error(`${url} is not the enrolments CSV (first column: “${rows.columns[0]}”).`);
        }
        setRequest({ status: 'ready', rows, error: null });
      } catch (error) {
        if (error.name !== 'AbortError') setRequest({ status: 'error', rows: null, error });
      }
    })();
    return () => controller.abort(); // leaving the page (or StrictMode) cancels the request
  }, [url, slow, attempt]);

  const rows = request.rows ?? [];
  // ---- d3-array: all derived during render, no extra state needed ----
  const groups = d3.group(rows, (d) => d[key]); // Map: key → array of rows
  const totals = d3.rollup(rows, (v) => d3.sum(v, students), (d) => d[key]); // Map: key → number
  const key2 = key === 'year' ? 'campus' : 'year'; // a second, DIFFERENT key for the two-level rollup
  const flat = d3.flatRollup(rows, (v) => d3.sum(v, students), (d) => d[key], (d) => d[key2]); // [[key, key2, sum], …]
  const bins = rows.length ? d3.bin().value(students).thresholds(binCount)(rows) : [];
  const summary = Array.from(groups, ([name, values]) => ({
    name,
    count: values.length,
    total: totals.get(name),
    mean: d3.mean(values, students),
    median: d3.median(values, students),
    sd: d3.deviation(values, students),
    extent: d3.extent(values, students),
  })).sort((a, b) => (key === 'year' ? a.name - b.name : d3.descending(a.total, b.total)));
  const mapPreview = (map, show) =>
    `Map(${map.size}) { ${Array.from(map).slice(0, 2).map(([k, v]) => `${JSON.stringify(k)} => ${show(v)}`).join(', ')}${map.size > 2 ? ', …' : ''} }`;

  return (
    <div className="stack">
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Group by">
          {KEYS.map((k) => (
            <button key={k} type="button" className={`btn btn-sm${k === key ? ' active' : ''}`} aria-pressed={k === key} onClick={() => setKey(k)}>
              d =&gt; d.{k}
            </button>
          ))}
        </div>
        <label className="d3-basics-inline-range">
          bins ≈ {binCount}
          <input type="range" min="3" max="20" value={binCount} onChange={(e) => setBinCount(Number(e.target.value))} />
        </label>
        <button type="button" className="btn btn-sm" onClick={() => setAttempt((n) => n + 1)}>
          <RefreshCw size={15} aria-hidden="true" /> Reload
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setUrl(url === GOOD_URL ? TYPO_URL : GOOD_URL)}>
          <TriangleAlert size={15} aria-hidden="true" /> {url === GOOD_URL ? 'Load a wrong path' : 'Fix the path'}
        </button>
        <label className="switch">
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
          <span className="switch-track" /> Slow network
        </label>
      </div>

      {request.status === 'loading' && (
        <p className="row muted m-0" role="status"><span className="spinner" aria-hidden="true" /> Loading {url}…</p>
      )}
      {request.status === 'error' && (
        <div className="alert alert-danger" role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          <div>
            <strong>Could not load the data.</strong> {request.error.message}{' '}
            <button type="button" className="btn btn-sm" onClick={() => setUrl(GOOD_URL)}>Use the right path</button>
          </div>
        </div>
      )}

      {request.status === 'ready' && (
        <>
          <div className="grid-2">
            <TotalsChart data={summary} title={`Total students by ${key} (d3.rollup)`} />
            <Histogram bins={bins} title="Rows by class size (d3.bin)" />
          </div>

          <p className="small muted m-0">
            Students per row across all {rows.length} rows – each function takes the rows and an accessor, <code>d =&gt; d.students</code>:
          </p>
          <ul className="d3-basics-stats">
            {[
              ['d3.extent', d3.extent(rows, students).join(' – ')],
              ['d3.mean', fmt(d3.mean(rows, students))],
              ['d3.median', fmt(d3.median(rows, students))],
              ['d3.deviation', fmt(d3.deviation(rows, students))],
            ].map(([fn, value]) => (
              <li key={fn} className="card">
                <code>{fn}(rows, …)</code>
                <strong>{value}</strong>
              </li>
            ))}
          </ul>

          <div className="table-wrap">
            <table className="table">
              <caption>One row per group: d3.group + d3.mean / median / deviation / extent</caption>
              <thead>
                <tr>
                  <th scope="col">{key}</th>
                  <th scope="col" className="num">Rows</th>
                  <th scope="col" className="num">Total</th>
                  <th scope="col" className="num">Mean</th>
                  <th scope="col" className="num">Median</th>
                  <th scope="col" className="num">Std dev</th>
                  <th scope="col" className="num">Min – max</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((g) => (
                  <tr key={g.name}>
                    <th scope="row">{g.name}</th>
                    <td className="num">{g.count}</td>
                    <td className="num">{d3.format(',')(g.total)}</td>
                    <td className="num">{fmt(g.mean)}</td>
                    <td className="num">{fmt(g.median)}</td>
                    <td className="num">{fmt(g.sd)}</td>
                    <td className="num">{g.extent.join(' – ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <pre className="demo-output">
            {[
              `const rows = await d3.csv('${GOOD_URL}', d3.autoType);`,
              `rows[0] → ${JSON.stringify(rows[0])}   // year and students are numbers now`,
              '',
              `d3.group(rows, d => d.${key}) → ${mapPreview(groups, (v) => `Array(${v.length})`)}`,
              `d3.rollup(rows, v => d3.sum(v, d => d.students), d => d.${key}) → ${mapPreview(totals, (v) => v)}`,
              `d3.flatRollup(…, d => d.${key}, d => d.${key2}) → ${flat.length} rows: ${flat.slice(0, 2).map((r) => JSON.stringify(r)).join(', ')}, …`,
              `d3.bin().value(d => d.students).thresholds(${binCount})(rows) → ${bins.length} bins (nice boundaries, so ≈ ${binCount})`,
            ].join('\n')}
          </pre>

          {/* The histogram's numbers as a table (the totals chart is already in the table above) */}
          <details className="d3-basics-details">
            <summary>Show data table</summary>
            <div className="table-wrap">
              <table className="table">
                <caption>Rows by class size: the {bins.length} bins from d3.bin()</caption>
                <thead>
                  <tr><th scope="col">Students per row</th><th scope="col" className="num">Rows</th></tr>
                </thead>
                <tbody>
                  {bins.map((b) => (
                    <tr key={b.x0}>
                      <th scope="row">{b.x0} – {b.x1}</th>
                      <td className="num">{b.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
