/**
 * RequestJourney – follow ONE real request from React to FastAPI and back.
 *
 * The request is sent immediately; the hops then light up one after another
 * (slowed down so you can follow them) and the real round-trip time is shown
 * at the end. Choose /api/health to see a request that also reaches the database.
 */
import { useEffect, useRef, useState } from 'react';
import { Database, MonitorSmartphone, Route, Send, Server } from 'lucide-react';

import { api } from '../../../api/client.js';
import ResponseView from './ResponseView.jsx';

const HOPS = [
  { icon: MonitorSmartphone, title: 'Browser · React', where: 'localhost:3000' },
  { icon: Route, title: 'Vite dev server', where: 'proxies /api/*' },
  { icon: Server, title: 'FastAPI (uvicorn)', where: '127.0.0.1:8000' },
  { icon: Database, title: 'SQLite / ML model', where: 'app.db · model file' },
];
const LINK_LABELS = ['HTTP', 'proxied', 'SQL · model'];
const STEP_MS = 550; // animation speed – the real request is MUCH faster

/** The story of one request, as a list of steps (hop = a box, link = an arrow). */
function buildSteps(path, usesDatabase) {
  const route = usesDatabase ? '@router.get("/health") in routers/health.py' : '@router.get("/hello") in routers/basics.py';
  return [
    { hop: 0, text: `React: api.get('${path}') – client.js calls fetch()` },
    { link: 0, dir: 'out', text: `Browser → GET ${window.location.origin}${path}` },
    { hop: 1, text: `Vite: the path starts with /api → forward to http://127.0.0.1:8000${path}` },
    { link: 1, dir: 'out' },
    { wait: true }, // ← here we wait for the real response
    { hop: 2, text: `FastAPI: matches ${route}, validates the parameters, calls the function` },
    ...(usesDatabase
      ? [{ link: 2, dir: 'out' }, { hop: 3, text: 'SQLite: SELECT 1 – is the database answering?' }, { link: 2, dir: 'back' }]
      : []),
    { link: 1, dir: 'back', text: 'FastAPI → JSON response with a status code' },
    { hop: 1 },
    { link: 0, dir: 'back' },
    { hop: 0, text: 'client.js parses the JSON → setState → React re-renders' },
  ];
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function RequestJourney() {
  const [target, setTarget] = useState('hello'); // 'hello' | 'health'
  const [name, setName] = useState('Mia');
  const [steps, setSteps] = useState([]);
  const [current, setCurrent] = useState(-1); // index into steps
  const [failed, setFailed] = useState(false);
  const [exchange, setExchange] = useState(null); // { request, result }
  const runRef = useRef(0); // id of the newest run – older runs stop animating
  const controllerRef = useRef(null);

  useEffect(() => () => {
    runRef.current += 1; // stop the animation loop…
    controllerRef.current?.abort(); // …and the request, when the component unmounts
  }, []);

  async function handleSend() {
    const runId = ++runRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const usesDatabase = target === 'health';
    const path = usesDatabase ? '/api/health' : `/api/basics/hello?name=${encodeURIComponent(name.trim() || 'World')}`;
    const story = buildSteps(path, usesDatabase);
    setSteps(story);
    setFailed(false);
    setExchange({ request: { method: 'GET', path }, result: null });

    // 1. Start the REAL request right away and time it.
    const started = performance.now();
    const response = api.get(path, { signal: controller.signal }).then(
      (data) => ({ status: 200, data, ms: Math.round(performance.now() - started) }),
      (error) => ({ status: error.status, error, ms: Math.round(performance.now() - started) }),
    );

    // 2. Play the story step by step.
    for (let index = 0; index < story.length; index += 1) {
      if (story[index].wait) {
        const result = await response;
        if (runRef.current !== runId) return;
        setExchange({ request: { method: 'GET', path }, result });
        if (result.error?.isOffline) {
          setFailed(true); // the proxy could not reach uvicorn – the journey ends here
          setCurrent(index);
          return;
        }
        continue;
      }
      setCurrent(index);
      await delay(STEP_MS);
      if (runRef.current !== runId) return; // a newer run started, or we unmounted
    }
    setCurrent(story.length); // finished: everything stays lit
  }

  // Derive each box/arrow's look from the current step (no extra state needed).
  const visited = steps.slice(0, current + 1);
  const hopState = (i) => {
    if (failed && i === 2) return 'error';
    if (steps[current]?.hop === i) return 'active';
    if (visited.some((s) => s.hop === i)) return 'done';
    if (i === 3 && steps.length && !steps.some((s) => s.hop === 3)) return 'skipped';
    return 'idle';
  };
  const linkDir = (i) => (steps[current]?.link === i ? steps[current].dir : undefined);
  const log = visited.filter((s) => s.text);
  const busy = current >= 0 && current < steps.length && !failed;

  return (
    <div className="stack">
      <div className="row">
        <div className="btn-group" role="group" aria-label="Which request">
          <button type="button" className={`btn btn-sm ${target === 'hello' ? 'active' : ''}`} aria-pressed={target === 'hello'} onClick={() => setTarget('hello')}>
            GET /api/basics/hello
          </button>
          <button type="button" className={`btn btn-sm ${target === 'health' ? 'active' : ''}`} aria-pressed={target === 'health'} onClick={() => setTarget('health')}>
            GET /api/health
          </button>
        </div>
        {target === 'hello' && (
          <label className="fastapi-inline-field">
            name =
            <input className="input fastapi-input-sm" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <button type="button" className="btn btn-primary" onClick={handleSend} disabled={busy}>
          <Send size={16} aria-hidden="true" /> Send a request
        </button>
      </div>

      <div className="fastapi-journey-wrap">
        <ol className="fastapi-journey" aria-label="The path of one request">
          {HOPS.map(({ icon: Icon, title, where }, i) => (
            <li key={title} className="fastapi-journey-item">
              <div className="fastapi-hop" data-state={hopState(i)}>
                <span className="fastapi-hop-icon"><Icon size={20} aria-hidden="true" /></span>
                <strong>{title}</strong>
                <span className="small muted mono">{where}</span>
              </div>
              {i < HOPS.length - 1 && (
                <div className="fastapi-link" data-dir={linkDir(i)} aria-hidden="true">
                  <span className="fastapi-link-label">{LINK_LABELS[i]}</span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* The live region is always rendered (only its content changes), so screen readers
          also announce the FIRST step, not just the later ones. */}
      <div aria-live="polite" className="stack-sm">
        {log.length > 0 && (
          <ol className="fastapi-trace">
            {log.map((step, i) => (
              <li key={step.text} className={i === log.length - 1 && busy ? 'is-current' : undefined}>{step.text}</li>
            ))}
          </ol>
        )}
        {failed && <p className="error-text">✗ Vite could not reach FastAPI on port 8000 – is uvicorn running?</p>}
      </div>
      {exchange?.result && current >= steps.length && (
        <p className="fastapi-rtt">
          Real round trip: <strong>{exchange.result.ms} ms</strong>{' '}
          <span className="muted small">(measured with performance.now() – the animation is slowed down so you can follow it)</span>
        </p>
      )}
      {exchange && <ResponseView request={exchange.request} result={exchange.result} loading={!exchange.result} />}
    </div>
  );
}
