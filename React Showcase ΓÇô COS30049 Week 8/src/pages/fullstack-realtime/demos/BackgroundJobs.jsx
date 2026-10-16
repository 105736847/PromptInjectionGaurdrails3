/**
 * BackgroundJobs – start slow work on the server and watch it by POLLING.
 *
 * POST /api/jobs answers "202 Accepted" straight away (look at the timing!) and the work goes
 * on in the background. Every <JobCard> then asks GET /api/jobs/{id} every 500 ms.
 * The jobs live on the SERVER: reload the page and running jobs are found again.
 */
import { useEffect, useId, useState } from 'react';
import { Play } from 'lucide-react';
import { api } from '../../../api/client.js';
import JobCard from './JobCard.jsx';
import { JOB_KINDS } from './jobKinds.js';

export default function BackgroundJobs() {
  const [kind, setKind] = useState('train-model');
  const [steps, setSteps] = useState(8);
  const [fail, setFail] = useState(false);
  const [jobs, setJobs] = useState([]); // the 202 answers; each card polls for the rest
  const [starting, setStarting] = useState(false);
  const [lastStart, setLastStart] = useState(null); // { id, ms }
  const [error, setError] = useState(null);
  const kindId = useId();
  const stepsId = useId();

  // On mount: pick up jobs that are still running on the server (e.g. after a page reload).
  useEffect(() => {
    const controller = new AbortController();
    api.get('/api/jobs?limit=6', { signal: controller.signal })
      .then((list) => {
        const running = list.filter((job) => !['completed', 'failed', 'cancelled'].includes(job.status));
        // Merge: the user may already have started a job while this request was on its way.
        setJobs((current) => [...current, ...running.filter((job) => !current.some((c) => c.id === job.id))]);
      })
      .catch(() => {}); // offline is fine here – the banner above explains it
    return () => controller.abort();
  }, []);

  async function start(event) {
    event.preventDefault();
    setStarting(true);
    setError(null);
    const began = performance.now();
    try {
      const job = await api.post('/api/jobs', { kind, steps, fail_at: fail ? Math.ceil(steps / 2) : null });
      setLastStart({ id: job.id, ms: Math.round(performance.now() - began) });
      setJobs((list) => [job, ...list]);
    } catch (err) {
      setError(err);
    } finally {
      setStarting(false);
    }
  }

  const dismiss = (id) => setJobs((list) => list.filter((job) => job.id !== id));

  return (
    <div className="stack">
      <form className="rt-controls" onSubmit={start}>
        <div className="field">
          <label className="label" htmlFor={kindId}>Job</label>
          <select id={kindId} className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
            {JOB_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor={stepsId}>Steps: {steps} (≈ {Math.round(steps * 0.6)} s)</label>
          <input id={stepsId} type="range" min={2} max={20} value={steps} onChange={(e) => setSteps(Number(e.target.value))} style={{ height: 40 }} />
        </div>
        <label className="check" style={{ height: 40 }}>
          <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} /> Make it fail halfway
        </label>
        <button type="submit" className="btn btn-primary" disabled={starting}>
          <Play size={16} aria-hidden="true" /> {starting ? 'Starting…' : 'Start job'}
        </button>
      </form>

      {lastStart && (
        <p className="rt-note" role="status">
          <code>POST /api/jobs</code> → <strong>202 Accepted</strong> in {lastStart.ms} ms (job <span className="mono">#{lastStart.id}</span>).
          The work carries on in the background – start a few more!
        </p>
      )}
      {error && <p className="error-text" role="alert">{error.isOffline ? 'Start the back end – see the banner above.' : error.message}</p>}

      {jobs.length === 0 ? (
        <p className="muted small m-0">No jobs yet. Start one – or three at once.</p>
      ) : (
        <div className="rt-jobs">
          {jobs.map((job) => <JobCard key={job.id} initial={job} onDismiss={dismiss} />)}
        </div>
      )}
    </div>
  );
}
