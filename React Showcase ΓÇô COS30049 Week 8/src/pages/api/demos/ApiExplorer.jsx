/**
 * ApiExplorer – fetching ON DEMAND, from an event handler (no useEffect).
 *
 * Use an effect when data must load because something appeared on screen.
 * Use an event handler when data loads because the user DID something
 * (clicked "Send", submitted a form…). async/await keeps the code readable.
 */
import { useEffect, useRef, useState } from 'react';
import { Clock, Send } from 'lucide-react';

const BASE_URL = 'https://jsonplaceholder.typicode.com';
const ENDPOINTS = ['/users', '/posts/1', '/todos?_limit=5', '/nope-404'];

function statusClass(status) {
  if (status >= 500) return 'badge-danger';
  if (status >= 400) return 'badge-warning';
  return 'badge-success';
}

export default function ApiExplorer() {
  const [endpoint, setEndpoint] = useState(ENDPOINTS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const controllerRef = useRef(null); // the AbortController of the request in flight

  // Cancel a pending request if the component unmounts.
  useEffect(() => () => controllerRef.current?.abort(), []);

  async function handleSend() {
    controllerRef.current?.abort(); // a new request replaces any older one
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    const started = performance.now();
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, { signal: controller.signal });
      const text = await response.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = text; // not JSON – show it as plain text
      }
      setResult({
        url: `${BASE_URL}${endpoint}`,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        ms: Math.round(performance.now() - started),
        body,
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      // Only network problems end up here (offline, DNS, CORS…) – not 404s!
      setResult({ url: `${BASE_URL}${endpoint}`, networkError: err.message, ms: Math.round(performance.now() - started) });
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  }

  return (
    <div className="stack">
      <div className="api-request-bar">
        <span className="badge badge-code">GET</span>
        <label htmlFor="explorer-endpoint" className="visually-hidden">
          Endpoint
        </label>
        <select
          id="explorer-endpoint"
          className="input"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
        >
          {ENDPOINTS.map((path) => (
            <option key={path} value={path}>
              {path}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary" onClick={handleSend} disabled={loading}>
          {loading ? <span className="spinner api-spinner-sm" aria-hidden="true" /> : <Send size={16} />}
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>

      {result === null && !loading && <p className="m-0 small muted">Pick an endpoint and press Send.</p>}

      {result && (
        <div className="stack-sm" aria-live="polite">
          <div className="row small">
            {result.networkError ? (
              <span className="badge badge-danger">Network error</span>
            ) : (
              <span className={`badge ${statusClass(result.status)}`}>
                {result.status} {result.ok ? 'OK' : 'Error'}
              </span>
            )}
            <span className="row muted">
              <Clock size={14} aria-hidden="true" /> {result.ms} ms
            </span>
            {result.contentType && <span className="muted mono">{result.contentType}</span>}
          </div>
          <p className="m-0 small mono muted api-url">{result.url}</p>
          <pre className="demo-output api-json">
            {result.networkError ?? JSON.stringify(result.body, null, 2)}
          </pre>
          {!result.ok && !result.networkError && (
            <p className="m-0 small muted">
              Notice: fetch() did <strong>not</strong> throw for this {result.status}. Always check{' '}
              <code>response.ok</code>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
