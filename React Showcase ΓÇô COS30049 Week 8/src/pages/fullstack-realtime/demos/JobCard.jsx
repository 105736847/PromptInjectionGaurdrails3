/**
 * JobCard – ONE background job. Each card polls its own job with usePolling(), so starting
 * three jobs gives three independent polling loops. Removing the card (unmounting it) stops
 * its loop automatically – that is what the effect cleanup inside usePolling is for.
 */
import { useEffect, useRef, useState } from 'react';
import { CircleStop, X } from 'lucide-react';
import { api } from '../../../api/client.js';
import usePolling from './usePolling.js';
import { jobLabel } from './jobKinds.js';
import { formatTime } from './format.js';

const FINISHED = new Set(['completed', 'failed', 'cancelled']);
const BADGE = { running: 'badge-info', cancelling: 'badge-warning', completed: 'badge-success', failed: 'badge-danger' };

export default function JobCard({ initial, onDismiss }) {
  const { data, error, requests } = usePolling((signal) => api.get(`/api/jobs/${initial.id}`, { signal, timeout: 4000 }), {
    interval: 500,
    isDone: (job) => FINISHED.has(job.status),
    key: initial.id,
  });
  const job = data ?? initial; // show the 202 answer until the first poll comes back
  const gone = error?.status === 404; // the server restarted and forgot the job (jobs live in memory)
  const finished = FINISHED.has(job.status) || gone;
  const [cancelError, setCancelError] = useState(null);
  const logRef = useRef(null);

  // Keep the newest log line in view (a DOM side effect, so it belongs in an effect).
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [job.log.length]);

  async function cancel() {
    setCancelError(null);
    try {
      await api.delete(`/api/jobs/${job.id}`); // 202: the job stops at its next step – keep polling
    } catch (err) {
      setCancelError(err.message);
    }
  }

  const seconds = job.finished_at && job.started_at ? (new Date(job.finished_at) - new Date(job.started_at)) / 1000 : null;
  const barClass = job.status === 'completed' ? ' is-done' : job.status === 'failed' ? ' is-error' : finished ? ' is-muted' : '';
  const label = jobLabel(job.kind);

  return (
    <article className="rt-job" aria-label={`${label} job ${job.id}`}>
      {/* The live region exists from the start and only its text changes → announced once, at the end. */}
      <span className="visually-hidden" role="status">
        {finished ? `${label} job ${gone ? 'is no longer on the server' : job.status}${job.error ? `: ${job.error}` : ''}` : ''}
      </span>
      <div className="row-between">
        <strong>{label}</strong>
        <span className="row" style={{ gap: 6 }}>
          <span className={`badge ${BADGE[job.status] ?? ''}`}>{job.status}</span>
          {finished ? (
            <button type="button" className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => onDismiss(job.id)} aria-label="Remove this card">
              <X size={15} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="btn btn-sm" onClick={cancel} disabled={job.status === 'cancelling'}>
              <CircleStop size={14} aria-hidden="true" /> Cancel
            </button>
          )}
        </span>
      </div>

      <div className={`rt-progress${barClass}`} role="progressbar" aria-label="Job progress"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={job.progress}>
        <span style={{ width: `${job.progress}%` }} />
      </div>
      <p className="rt-note">
        <strong>{Math.round(job.progress)}%</strong> · step {job.step}/{job.steps} · <span className="mono">#{job.id}</span> · {requests} polls
        {seconds !== null && ` · took ${seconds.toFixed(1)} s`}
      </p>

      {/* The server sends each line's time in UTC; formatTime shows it in the viewer's own time zone. */}
      <pre className="demo-output rt-job-log" ref={logRef} aria-label="Job log">
        {job.log.map((line) => `${formatTime(line.time)}  ${line.text}`).join('\n')}
      </pre>

      {job.result && <p className="rt-note">Result: <code>{JSON.stringify(job.result)}</code></p>}
      {job.error && <p className="error-text">{job.error}</p>}
      {cancelError && <p className="error-text">{cancelError}</p>}
      {error && (
        <p className="error-text">
          {error.isOffline ? 'Lost the back end – still trying…' : gone ? `${error.message} (Did the server restart?)` : error.message}
        </p>
      )}
    </article>
  );
}
