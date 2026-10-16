/**
 * CsvAnalyser – upload a CSV, let Python analyse it, draw what comes back.
 *
 * The server does the heavy lifting (the csv + statistics modules); React only renders the
 * JSON: summary tiles, a small histogram per numeric column and a table of every column.
 * Plain api.post() (fetch) is fine here – a small CSV doesn't need an upload progress bar.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { FileSpreadsheet, Sparkles, TriangleAlert } from 'lucide-react';
import { api } from '../../../api/client.js';
import MiniHistogram from './MiniHistogram.jsx';
import { makeStudentCsv } from './data/sampleCsv.js';

const num = (v) => (v == null ? '–' : v.toLocaleString(undefined, { maximumFractionDigits: 2 }));
// "student_id", "id", "Unit ID" … but not "paid" or "valid"
const looksLikeId = (name) => /(^|[^a-z])id$/i.test(name);

export default function CsvAnalyser() {
  const [file, setFile] = useState(null);
  const [bins, setBins] = useState(10);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestRef = useRef(null); // AbortController of the request in flight
  const inputId = useId();
  const binsId = useId();

  useEffect(() => () => requestRef.current?.abort(), []); // leaving the page cancels the request

  async function analyse(csvFile, binCount = bins) {
    requestRef.current?.abort(); // a newer request replaces an older one – never show a stale answer
    const controller = new AbortController();
    requestRef.current = controller;
    setFile(csvFile);
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append('file', csvFile); // the field name must match the FastAPI parameter `file`
    try {
      const url = `/api/files/csv-summary?bins=${binCount}`;
      setSummary(await api.post(url, form, { signal: controller.signal, timeout: 20000 }));
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err);
      setSummary(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function changeBins(event) {
    const count = Number(event.target.value);
    setBins(count);
    if (file) analyse(file, count); // ask the server again with the new bin count
  }

  const numeric = summary?.columns.filter((c) => c.kind === 'numeric') ?? [];
  const idColumn = numeric.find((c) => looksLikeId(c.name));

  return (
    <div className="stack">
      <div className="row">
        <span className="rt-file-pick">
          <input id={inputId} type="file" accept=".csv,text/csv" className="visually-hidden"
            onChange={(e) => { if (e.target.files[0]) analyse(e.target.files[0]); e.target.value = ''; }} />
          <label htmlFor={inputId} className="btn btn-primary"><FileSpreadsheet size={16} aria-hidden="true" /> Choose a CSV…</label>
        </span>
        <button type="button" className="btn" onClick={() => analyse(new File([makeStudentCsv()], 'students-sample.csv'))}>
          <Sparkles size={16} aria-hidden="true" /> Use sample data
        </button>
        <label className="row small" htmlFor={binsId}>
          Bins
          <select id={binsId} className="input" style={{ width: 'auto', height: 34 }} value={bins} onChange={changeBins}>
            {[5, 10, 20].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      {loading && <p className="muted small m-0" role="status"><span className="spinner" aria-hidden="true" /> Analysing {file.name} on the server…</p>}
      {error && (
        <div className="alert alert-danger" role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          <div>{error.isOffline ? 'Start the back end – see the banner above.' : `${error.status} – ${error.message}`}</div>
        </div>
      )}
      {!summary && !loading && !error && <p className="muted small m-0">Choose a CSV with a header row, or use the fictional sample.</p>}

      {summary && (
        <>
          <div className="rt-stats">
            <div className="rt-stat"><strong>{summary.rows.toLocaleString()}</strong><span>rows in {summary.filename}</span></div>
            <div className="rt-stat"><strong>{summary.columns.length}</strong><span>columns</span></div>
            <div className="rt-stat"><strong>{numeric.length}</strong><span>numeric columns</span></div>
            <div className="rt-stat"><strong>{summary.columns.reduce((sum, c) => sum + c.missing, 0)}</strong><span>empty cells</span></div>
          </div>
          {summary.truncated && (
            <p className="rt-note">The file is long, so the server analysed only the first {summary.rows.toLocaleString()} rows.</p>
          )}

          <div className="rt-hist-grid">
            {numeric.map((column, i) => (
              <figure key={`${i}-${column.name}`} className="rt-hist-card">
                <figcaption><strong className="mono">{column.name}</strong><span className="muted">mean {num(column.mean)} · sd {num(column.std)}</span></figcaption>
                <MiniHistogram bins={column.histogram} label={column.name} />
              </figure>
            ))}
          </div>
          {idColumn && (
            <p className="rt-note">
              <strong>Careful:</strong> <code>{idColumn.name}</code> is a number but not a quantity – its mean and histogram
              mean nothing. Treat ID columns as text, or drop them before training a model.
            </p>
          )}

          <div className="table-wrap">
            <table className="table">
              <caption>Every column, as summarised by Python</caption>
              <thead>
                <tr>
                  <th scope="col">Column</th><th scope="col">Type</th><th scope="col" className="num">Missing</th>
                  <th scope="col" className="num">Unique</th><th scope="col" className="num">Min</th><th scope="col" className="num">Median</th>
                  <th scope="col" className="num">Max</th><th scope="col">Most common</th>
                </tr>
              </thead>
              <tbody>
                {summary.columns.map((c, i) => (
                  <tr key={`${i}-${c.name}`}>
                    <th scope="row" className="mono small">{c.name}</th>
                    <td><span className={`badge ${c.kind === 'numeric' ? 'badge-info' : ''}`}>{c.kind}</span></td>
                    <td className="num">{c.missing}</td>
                    <td className="num">{c.unique}</td>
                    <td className="num">{num(c.min)}</td>
                    <td className="num">{num(c.median)}</td>
                    <td className="num">{num(c.max)}</td>
                    <td>{c.top?.length ? `${c.top[0].value} (${c.top[0].count})` : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details>
            <summary className="small">The first {summary.preview.length} rows, as Python’s csv module read them</summary>
            <div className="table-wrap mt-1">
              <table className="table">
                <thead>
                  <tr>{summary.columns.map((c, i) => <th key={`${i}-${c.name}`} scope="col">{c.name}</th>)}</tr>
                </thead>
                <tbody>
                  {summary.preview.map((row, r) => (
                    <tr key={r}>{summary.columns.map((c, i) => <td key={`${i}-${c.name}`}>{row[c.name]}</td>)}</tr>
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
