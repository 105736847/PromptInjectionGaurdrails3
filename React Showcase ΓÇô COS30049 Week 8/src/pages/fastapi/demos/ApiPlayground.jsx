/**
 * ApiPlayground – a mini Postman for the whole back end.
 *
 * It downloads /api/openapi.json (written by FastAPI from your code), lists every
 * endpoint grouped by tag, and builds a form for the one you pick. This is the
 * one place on the page that calls fetch() directly instead of client.js: a
 * playground must show the RAW response – any status, every header – rather
 * than turn errors into exceptions.
 */
import { useEffect, useRef, useState } from 'react';
import { KeyRound, Plus, RefreshCw, Send, Trash2 } from 'lucide-react';

import { api, API_BASE } from '../../../api/client.js';
import { bodyKind, exampleBody, exampleFor, findOperation, groupOperations, typeLabel } from './openapi.js';
import { StatusBadge } from './ResponseView.jsx';

const START = 'GET /api/basics/units/{unit_code}';
let nextHeaderId = 1;

/** A stream of Server-Sent Events may never end – read it for `ms`, then hang up. */
async function readForAWhile(res, ms) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const stop = setTimeout(() => reader.cancel(), ms); // cancel() makes read() report done
  let text = '';
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    clearTimeout(stop);
  }
  return text;
}

export default function ApiPlayground() {
  const [spec, setSpec] = useState(null);
  const [specError, setSpecError] = useState(null);
  const [opId, setOpId] = useState(START);
  const [values, setValues] = useState({}); // "query:limit" → "3"
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState([]); // [{ id, name, value }]
  const [response, setResponse] = useState(null);
  const [sending, setSending] = useState(false);
  const [attempt, setAttempt] = useState(0); // bump it to load the spec again
  const [reloading, setReloading] = useState(false);
  const controllerRef = useRef(null); // the request sent with "Send"
  const reloadRef = useRef(null); // the spec request sent with "Reload"

  const groups = spec ? groupOperations(spec) : [];
  const operation = spec ? findOperation(spec, opId) : null;

  /** Fill the form with sensible starting values for one endpoint. */
  function prefill(op, loadedSpec) {
    // Path parameters are always required → start with an example value.
    setValues(Object.fromEntries(op.parameters.filter((p) => p.in === 'path').map((p) => [`path:${p.name}`, String(exampleFor(p.schema, loadedSpec) ?? '')])));
    setBody(exampleBody(op.requestBody, loadedSpec));
    setResponse(null);
  }

  function choose(id) {
    // A request still running for the OLD endpoint must not show up under the new one.
    controllerRef.current?.abort();
    controllerRef.current = null; // → handleSend() sees it was replaced and ignores it
    setSending(false);
    setOpId(id);
    prefill(findOperation(spec, id), spec);
  }

  useEffect(() => {
    const controller = new AbortController();
    api
      .get('/api/openapi.json', { signal: controller.signal })
      .then((loaded) => {
        setSpec(loaded);
        const first = findOperation(loaded, START);
        if (first) prefill(first, loaded);
      })
      .catch((error) => !controller.signal.aborted && setSpecError(error));
    return () => {
      controller.abort(); // leaving the page: stop loading the spec…
      controllerRef.current?.abort(); // …and any request that is still running
      reloadRef.current?.abort();
    };
  }, [attempt]); // prefill() only calls state setters, which never change

  // ---- build the request from the form (derived during render) ----
  const params = operation?.parameters ?? [];
  const value = (p) => values[`${p.in}:${p.name}`] ?? '';
  const path = operation ? operation.path.replace(/\{(\w+)\}/g, (_, name) => encodeURIComponent(values[`path:${name}`] ?? '')) : '';
  const query = new URLSearchParams(params.filter((p) => p.in === 'query' && value(p) !== '').map((p) => [p.name, value(p)])).toString();
  const url = `${path}${query ? `?${query}` : ''}`;
  const kind = bodyKind(operation?.requestBody);
  const allHeaders = {
    ...Object.fromEntries(params.filter((p) => p.in === 'header' && value(p) !== '').map((p) => [p.name, value(p)])),
    ...Object.fromEntries(headers.filter((h) => h.name.trim()).map((h) => [h.name.trim(), h.value])),
  };

  async function handleSend() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const init = { method: operation.method, headers: { Accept: 'application/json', ...allHeaders }, signal: controller.signal };
    if (kind === 'json' && body.trim()) {
      try {
        JSON.parse(body); // catch typos here instead of sending broken JSON
      } catch (error) {
        setResponse({ problem: `The body is not valid JSON: ${error.message}` });
        return;
      }
      init.headers['Content-Type'] = 'application/json';
      init.body = body;
    } else if (kind === 'form') {
      init.body = new URLSearchParams(body.split('\n').filter((line) => line.includes('=')).map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1)]));
    }
    setSending(true);
    const timer = setTimeout(() => controller.abort(), 15000);
    const started = performance.now();
    try {
      const res = await fetch(`${API_BASE}${url}`, init); // resolves for 404/500 too!
      // text/event-stream (the Real-time page's live feed) never ends: take 3 s of it.
      const stream = Boolean(res.headers.get('content-type')?.includes('text/event-stream'));
      const text = stream ? await readForAWhile(res, 3000) : await res.text();
      let data = text;
      try { data = JSON.parse(text); } catch { /* not JSON – keep the text */ }
      setResponse({ status: res.status, ms: Math.round(performance.now() - started), headers: [...res.headers], data, bytes: text.length, stream });
    } catch (error) {
      if (controllerRef.current !== controller) return; // replaced or unmounted
      setResponse({ problem: error.name === 'AbortError' ? 'No answer within 15 s.' : `Network error: ${error.message}. Is the back end running?` });
    } finally {
      clearTimeout(timer);
      if (controllerRef.current === controller) setSending(false);
    }
  }

  /** "Reload": fetch the spec again, e.g. after you added an endpoint in Python (uvicorn
   *  --reload restarts and the new /api/openapi.json lists it). An event handler, not an
   *  effect: it runs because the user asked, not because something was rendered. */
  async function reloadSpec() {
    reloadRef.current?.abort();
    const controller = new AbortController();
    reloadRef.current = controller;
    setReloading(true);
    try {
      const loaded = await api.get('/api/openapi.json', { signal: controller.signal });
      setSpec(loaded);
      // Stay on the chosen endpoint (and keep its inputs) if it still exists.
      const start = findOperation(loaded, START);
      if (!findOperation(loaded, opId) && start) {
        setOpId(START);
        prefill(start, loaded);
      }
    } catch (error) {
      const hint = error.isOffline ? ' Start the back end – see the banner above.' : '';
      if (!controller.signal.aborted) setResponse({ problem: `Could not reload /api/openapi.json – ${error.message}${hint}` });
    } finally {
      if (!controller.signal.aborted) setReloading(false);
    }
  }

  const addHeader = (name = '', headerValue = '') => setHeaders((list) => [...list, { id: nextHeaderId++, name, value: headerValue }]);
  const setHeader = (id, patch) => setHeaders((list) => list.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const applyToken = (token) => setHeaders((list) => [...list.filter((h) => h.name.toLowerCase() !== 'authorization'), { id: nextHeaderId++, name: 'Authorization', value: `Bearer ${token}` }]);

  if (specError) {
    return (
      <div className="alert alert-warning row-between">
        <span>Could not load /api/openapi.json – {specError.message}{specError.isOffline ? ' Start the back end – see the banner above.' : ''}</span>
        <button type="button" className="btn btn-sm" onClick={() => { setSpecError(null); setAttempt((n) => n + 1); }}>
          Try again
        </button>
      </div>
    );
  }
  if (!spec) return <p className="row muted"><span className="spinner" aria-hidden="true" /> Loading /api/openapi.json…</p>;

  return (
    <div className="fastapi-playground stack">
      <div className="row">
        <label htmlFor="pg-operation" className="visually-hidden">Endpoint</label>
        <select id="pg-operation" className="input mono fastapi-grow" value={opId} onChange={(e) => choose(e.target.value)}>
          {groups.map((group) => (
            <optgroup key={group.tag} label={group.tag}>
              {group.operations.map((op) => <option key={op.id} value={op.id}>{op.id}</option>)}
            </optgroup>
          ))}
        </select>
        <button type="button" className="btn" onClick={reloadSpec} disabled={reloading} title="Load /api/openapi.json again">
          <RefreshCw size={16} aria-hidden="true" /> {reloading ? 'Reloading…' : 'Reload list'}
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSend} disabled={sending || !operation}>
          <Send size={16} aria-hidden="true" /> {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
      {operation && <p className="small muted m-0">{operation.summary} · {groups.reduce((n, g) => n + g.operations.length, 0)} endpoints in {groups.length} tags</p>}
      <code className="fastapi-url"><span className="fastapi-method">{operation?.method}</span> {url}</code>

      {params.length > 0 && (
        <fieldset>
          <legend>Parameters</legend>
          <div className="fastapi-param-grid">
            {params.map((p) => (
              <label key={`${p.in}:${p.name}`} className="field">
                <span className="label mono">{p.name}{p.required && <span className="required">*</span>}</span>
                <input
                  className="input mono"
                  value={value(p)}
                  placeholder={p.schema?.default !== undefined ? `default: ${p.schema.default}` : ''}
                  onChange={(e) => setValues({ ...values, [`${p.in}:${p.name}`]: e.target.value })}
                />
                <span className="hint fastapi-param-hint">
                  <span className="badge">{p.in}</span>
                  <span className="mono">{typeLabel(p.schema, spec)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend>Headers</legend>
        <div className="stack-sm">
          {headers.map((h) => (
            <div key={h.id} className="fastapi-header-row">
              <input className="input mono" aria-label="Header name" value={h.name} placeholder="Name" onChange={(e) => setHeader(h.id, { name: e.target.value })} />
              <input className="input mono" aria-label="Header value" value={h.value} placeholder="Value" onChange={(e) => setHeader(h.id, { value: e.target.value })} />
              <button type="button" className="btn-icon" aria-label={`Remove header ${h.name}`} onClick={() => setHeaders(headers.filter((x) => x.id !== h.id))}><Trash2 size={16} /></button>
            </div>
          ))}
          <div className="row">
            <button type="button" className="btn btn-sm" onClick={() => addHeader()}><Plus size={14} aria-hidden="true" /> Header</button>
            <button type="button" className="btn btn-sm" onClick={() => addHeader('X-API-Key', 'teaching-key')}><Plus size={14} aria-hidden="true" /> X-API-Key</button>
            <button type="button" className="btn btn-sm" onClick={() => addHeader('Authorization', 'Bearer ')}><Plus size={14} aria-hidden="true" /> Authorization</button>
          </div>
        </div>
      </fieldset>

      {kind && (
        <div className="field">
          <label className="label" htmlFor="pg-body">Body <span className="badge badge-code">{kind === 'json' ? 'application/json' : kind === 'form' ? 'form: one key=value per line' : 'multipart/form-data'}</span></label>
          {kind === 'multipart'
            ? <p className="hint">File uploads need a file picker – try this endpoint in /api/docs below or on the “Files, Jobs & Real-time” page.</p>
            : <textarea id="pg-body" className="input mono" rows={Math.min(12, body.split('\n').length + 1)} value={body} onChange={(e) => setBody(e.target.value)} spellCheck={false} />}
        </div>
      )}

      {response?.problem && <p className="alert alert-warning m-0" role="alert">{response.problem}</p>}
      {/* Always rendered (only its text changes), so screen readers announce every response. */}
      <p className="visually-hidden" aria-live="polite">
        {response?.status ? `Response: status ${response.status}, ${response.ms} ms, ${response.bytes} bytes` : ''}
      </p>
      {response?.status && (
        <section className="fastapi-response" aria-label="Response">
          <div className="fastapi-response-bar">
            <span className="row"><StatusBadge status={response.status} /><span className="muted small">{response.ms} ms · {response.bytes} bytes</span></span>
            {response.data?.access_token && (
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => applyToken(response.data.access_token)}>
                <KeyRound size={14} aria-hidden="true" /> Use this token
              </button>
            )}
          </div>
          {response.status >= 500 && !response.bytes && <p className="hint">An empty 5xx from the dev proxy usually means FastAPI is not running.</p>}
          {response.stream && <p className="hint">An event stream stays open, so this shows only its first 3 seconds. The “Files, Jobs &amp; Real-time” page reads it live with EventSource.</p>}
          <pre className="demo-output fastapi-tall">{typeof response.data === 'string' ? response.data || '(empty body)' : JSON.stringify(response.data, null, 2)}</pre>
          <details>
            <summary className="small">Response headers ({response.headers.length})</summary>
            <dl className="fastapi-kv">
              {response.headers.map(([name, headerValue]) => (
                <div key={name}><dt className="mono">{name}</dt><dd className="mono">{headerValue}</dd></div>
              ))}
            </dl>
          </details>
        </section>
      )}
    </div>
  );
}
