/**
 * HookLab – the useStudents() hook under the microscope, with a request log.
 *
 * The search box is NOT debounced here, on purpose: every key press changes
 * the params, so the hook starts a new request. Watch what happens to the
 * older ones. Then switch the protections OFF, keep the random latency ON and
 * press "Type “chen” fast": answers arrive out of order and an OLD one can
 * overwrite the new one – the classic race condition.
 *
 * In development you will also see request #1 aborted straight away:
 * StrictMode mounts, unmounts and re-mounts every component to test your cleanups.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Eraser, Keyboard, RefreshCw, TriangleAlert } from 'lucide-react';
import useStudents from './useStudents.js';
import { fullName } from './StudentBits.jsx';

const OUTCOME = {
  start: { label: 'pending…', badge: 'badge-info' },
  success: { label: 'shown', badge: 'badge-success' },
  aborted: { label: 'aborted', badge: '' },
  stale: { label: 'ignored (stale)', badge: 'badge-warning' },
  error: { label: 'error', badge: 'badge-danger' },
};

export default function HookLab() {
  const uid = useId();
  const [q, setQ] = useState('li');
  const [abort, setAbort] = useState(true);
  const [ignoreStale, setIgnoreStale] = useState(true);
  const [latency, setLatency] = useState(true);
  const [log, setLog] = useState([]);
  const typingTimers = useRef([]);

  // Each event updates "its" log line (matched by request id) or adds a new one; newest id on top.
  function handleEvent(event) {
    setLog((current) => {
      const exists = current.some((entry) => entry.id === event.id);
      const next = exists ? current.map((e) => (e.id === event.id ? { ...e, ...event } : e)) : [event, ...current];
      return next.sort((a, b) => b.id - a.id).slice(0, 12);
    });
  }

  const { data, dataUrl, error, loading, refetch } = useStudents(
    { q, sort: 'last_name', page_size: 5 },
    { abort, ignoreStale, latency: latency ? 1200 : 0, onEvent: handleEvent },
  );

  // Which search produced the rows on screen? Compare it with what is in the box.
  const shownQ = dataUrl ? new URLSearchParams(dataUrl.split('?')[1]).get('q') ?? '' : null;
  const raceBug = data && !loading && !error && shownQ !== q; // an error keeps old rows too – that is no race

  function typeFast(word) {
    typingTimers.current.forEach(clearTimeout);
    typingTimers.current = [...word].map((_, i) => setTimeout(() => setQ(word.slice(0, i + 1)), i * 90));
  }
  useEffect(() => () => typingTimers.current.forEach(clearTimeout), []); // unmount → stop "typing"

  return (
    <div className="stack">
      <div className="crud-lab-controls">
        <div className="field">
          <label className="label" htmlFor={`${uid}-q`}>Search (no debounce)</label>
          <input id={`${uid}-q`} className="input" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="stack-sm">
          <label className="switch small">
            <input type="checkbox" checked={abort} onChange={(e) => setAbort(e.target.checked)} />
            <span className="switch-track" /> Cancel old requests (AbortController)
          </label>
          <label className="switch small">
            <input type="checkbox" checked={ignoreStale} onChange={(e) => setIgnoreStale(e.target.checked)} />
            <span className="switch-track" /> Ignore stale responses
          </label>
          <label className="switch small">
            <input type="checkbox" checked={latency} onChange={(e) => setLatency(e.target.checked)} />
            <span className="switch-track" /> Random latency (0–1.2 s)
          </label>
        </div>
      </div>

      <div className="row">
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => typeFast('chen')}><Keyboard size={14} /> Type “chen” fast</button>
        <button type="button" className="btn btn-sm" onClick={refetch}><RefreshCw size={14} /> refetch()</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLog([])}><Eraser size={14} /> Clear log</button>
      </div>

      <div className="grid-2">
        <div className="stack-sm">
          <h4 className="crud-panel-title">On screen</h4>
          {raceBug && (
            <div className="alert alert-danger" role="alert">
              <TriangleAlert size={18} aria-hidden="true" />
              <div><strong>Race condition!</strong> You typed “{q}” but the list shows the answer for “{shownQ}” – an older response arrived last and won.</div>
            </div>
          )}
          {error && <p className="error-text m-0">{error.isOffline ? 'Start the back end – see the banner above.' : error.message}</p>}
          <div className={`card card-subtle crud-lab-result ${loading && data ? 'crud-is-loading' : ''}`}>
            <p className="small m-0">
              {data ? <>Results for <code>q="{shownQ}"</code>: <strong>{data.total}</strong> match{data.total === 1 ? '' : 'es'}</> : loading ? 'Loading…' : 'No data yet'}
            </p>
            <ul className="crud-lab-names">
              {data?.items.map((s) => <li key={s.id}>{fullName(s)}</li>)}
            </ul>
          </div>
        </div>

        <div className="stack-sm">
          <h4 className="crud-panel-title">Request log (newest first)</h4>
          <ol className="crud-log" aria-live="polite">
            {log.length === 0 && <li className="muted small">Type in the search box…</li>}
            {log.map((entry) => {
              const outcome = entry.type === 'success' && entry.stale ? { label: 'shown – STALE!', badge: 'badge-danger' } : OUTCOME[entry.type];
              return (
                <li key={entry.id}>
                  <span className="mono small subtle">#{entry.id}</span>
                  <span className="mono small crud-log-url">q={new URLSearchParams(entry.url.split('?')[1]).get('q') ?? ''}</span>
                  <span className={`badge ${outcome.badge}`}>{outcome.label}</span>
                  <span className="small muted">{entry.ms != null ? `${entry.ms} ms` : ''}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
