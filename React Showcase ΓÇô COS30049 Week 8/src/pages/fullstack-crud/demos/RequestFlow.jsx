/**
 * RequestFlow – follow ONE request from a React component to SQLite and back.
 *
 * Step through it with Back / Next, press Play, or send a REAL request: the
 * journey replays with the live values at every stop. The invalid request
 * (page_size=500) shows that Pydantic stops bad input BEFORE your code runs.
 */
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Send, StepBack, StepForward, TriangleAlert } from 'lucide-react';
import { api } from '../../../api/client.js';
import CodeBlock from '../../../components/common/CodeBlock.jsx';
import SequenceDiagram from './SequenceDiagram.jsx';
import { ACTORS, STEPS, skippedSteps } from './flowSteps.js';
import { STATUS_TEXT } from './StudentBits.jsx';

const VALID_URL = '/api/students?q=li&sort=score&order=desc&page_size=3';
const INVALID_URL = '/api/students?q=li&page_size=500';
const actorName = (id) => ACTORS.find((a) => a.id === id).label;

/** What the live run shows at step `i` (null = nothing extra to show). */
function liveNote(i, run) {
  if (!run) return null;
  const { outcome, url, body, status, ms } = run;
  if (skippedSteps(outcome).has(i)) {
    return { tone: 'muted', text: outcome === 'invalid' ? 'Skipped – validation failed, so list_students() never ran.' : 'Skipped – the request never reached FastAPI.' };
  }
  const items = body?.items ?? [];
  switch (i) {
    case 0: return outcome === 'offline' ? { tone: 'danger', text: `GET ${url}\n✗ ${run.message}` } : { tone: 'info', text: `GET ${url}` };
    case 2: return outcome === 'invalid'
      ? { tone: 'danger', text: `✗ 422 Unprocessable Content\n${body.detail.map((d) => `${d.loc.at(-1)}: ${d.msg}`).join('\n')}` }
      : { tone: 'success', text: '✓ q="li", sort="score", order="desc", page_size=3 (text → int), page=1 (default)' };
    case 4: return { tone: 'success', text: `✓ ${body?.total ?? 0} rows match; LIMIT 3 → ${items.length} Student objects` };
    case 5: return { tone: 'success', text: items.map((s) => `${s.first_name}: score ${s.score} → grade "${s.grade}"`).join('\n') || 'No rows' };
    case 6: return { tone: status < 400 ? 'success' : 'danger', text: `${status} ${STATUS_TEXT[status] ?? ''} · ${JSON.stringify(body).length} bytes of JSON · ${ms} ms round trip` };
    case 7:
      if (outcome === 'ok') return { tone: 'success', text: `state.data.items → ${items.map((s) => `${s.first_name} ${s.last_name}`).join(', ') || '[]'}` };
      if (outcome === 'offline') return { tone: 'danger', text: 'state.error → error.isOffline is true, so the UI says “Start the back end”' };
      return { tone: 'danger', text: `state.error → ApiError(${status}): the UI shows its message` };
    default: return null;
  }
}

export default function RequestFlow() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(null); // the last real request: { url, outcome, status, body, ms }
  const [sending, setSending] = useState(false);
  const controllerRef = useRef(null);
  const skipped = skippedSteps(run?.outcome);

  // The next / previous step that really happens in this run (skipped steps are jumped over).
  const move = (from, dir) => {
    let i = from + dir;
    while (skipped.has(i)) i += dir;
    return i >= 0 && i < STEPS.length ? i : from;
  };
  const next = move(step, 1);
  const prev = move(step, -1);

  // Autoplay: one timeout per step; pausing or a new step clears the old one.
  useEffect(() => {
    if (!playing) return undefined;
    const timer = setTimeout(() => (next === step ? setPlaying(false) : setStep(next)), 1600);
    return () => clearTimeout(timer);
  }, [playing, step, next]);

  useEffect(() => () => controllerRef.current?.abort(), []); // unmount → cancel a running request

  async function sendRequest(url) {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setSending(true);
    const started = performance.now();
    let result;
    try {
      result = { outcome: 'ok', status: 200, body: await api.get(url, { signal: controller.signal }) };
    } catch (error) {
      if (controller.signal.aborted) return;
      const outcome = error.isOffline ? 'offline' : error.status === 422 ? 'invalid' : 'error';
      result = { outcome, status: error.status, body: error.isOffline ? null : { detail: error.detail }, message: error.message };
    }
    setRun({ url, ms: Math.round(performance.now() - started), ...result });
    setSending(false);
    setStep(0); // replay the journey with the real values
    setPlaying(true);
  }

  function togglePlay() {
    if (!playing && next === step) setStep(0); // at the end → start again
    setPlaying((p) => !p);
  }

  const current = STEPS[step];
  const note = liveNote(step, run);
  const isCode = /\.(py|js)$/.test(current.file);

  return (
    <div className="stack">
      <div className="row-between">
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={() => { setPlaying(false); setStep(prev); }} disabled={prev === step}>
            <StepBack size={14} /> Back
          </button>
          <button type="button" className="btn btn-sm" onClick={togglePlay} aria-pressed={playing}>
            {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="btn btn-sm" onClick={() => { setPlaying(false); setStep(next); }} disabled={next === step}>
            Next <StepForward size={14} />
          </button>
        </div>
        <div className="row">
          <button type="button" className="btn btn-sm btn-primary" onClick={() => sendRequest(VALID_URL)} disabled={sending}>
            <Send size={14} /> Send a real request
          </button>
          <button type="button" className="btn btn-sm" onClick={() => sendRequest(INVALID_URL)} disabled={sending}>
            <TriangleAlert size={14} /> Send an invalid one
          </button>
        </div>
      </div>

      {run && (
        <p className="small muted m-0" role="status">
          Live run: <code>GET {run.url}</code> → {run.status ? `${run.status} ${STATUS_TEXT[run.status] ?? ''}` : 'no answer'} in {run.ms} ms
        </p>
      )}

      <div className="crud-flow">
        <SequenceDiagram step={step} skipped={skipped} onSelect={(i) => { setPlaying(false); setStep(i); }} />

        <div className="crud-step-detail stack-sm">
          {/* Only this short heading is live: reading the code aloud every 1.6 s would be noise. */}
          <div className="stack-sm" aria-live="polite" aria-atomic="true">
            <p className="crud-step-kicker m-0">
              Step {step + 1} of {STEPS.length} · {actorName(current.from)}
              {current.from !== current.to && ` → ${actorName(current.to)}`}
            </p>
            <h4 className="m-0">{current.title}</h4>
          </div>
          <p className="small m-0">{current.text}</p>
          {isCode ? (
            <div className="demo-card m-0 crud-code"><CodeBlock code={current.code} filename={current.file} /></div>
          ) : (
            <pre className="demo-output crud-mono-panel" aria-label={current.file}>{current.code}</pre>
          )}
          {note && <pre className={`demo-output crud-mono-panel crud-live crud-live-${note.tone}`}>{note.text}</pre>}
        </div>
      </div>
    </div>
  );
}
