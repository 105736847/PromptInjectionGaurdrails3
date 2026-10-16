/**
 * ResponseView – shows one request/response pair the same way in every demo:
 *
 *   GET /api/basics/hello?name=Mia              200 OK · 8 ms
 *   { "message": "Hello, Mia!", … }
 *
 * `result` comes from useRequest(): { status, ms, data } or { status, ms, error }.
 * A failed call shows FastAPI's "detail" – the part of the error body worth reading.
 */
import { ServerOff } from 'lucide-react';

export const STATUS_TEXT = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  418: "I'm a teapot",
  422: 'Unprocessable Content',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

export function StatusBadge({ status }) {
  const tone = !status || status >= 500 ? 'badge-danger' : status >= 400 ? 'badge-warning' : 'badge-success';
  return (
    <span className={`badge ${tone} mono`}>
      {status ? `${status} ${STATUS_TEXT[status] ?? ''}` : 'No response'}
    </span>
  );
}

/** The friendly message every demo shows when the back end can't be reached. */
export function OfflineNote({ error }) {
  return (
    <p className="fastapi-offline" role="alert">
      <ServerOff size={16} aria-hidden="true" />
      <span>
        {error.message} Start the back end – see the banner at the top of the page.
      </span>
    </p>
  );
}

export default function ResponseView({ request, result, loading }) {
  if (!request) return null;
  return (
    <div className="fastapi-response" aria-live="polite" aria-busy={loading}>
      <div className="fastapi-response-bar">
        <code className="fastapi-request-line">
          <span className="fastapi-method">{request.method}</span> {request.path}
        </code>
        {loading && <span className="spinner" role="status" aria-label="Waiting for the server" />}
        {result && (
          <span className="row">
            <StatusBadge status={result.status} />
            <span className="muted small">{result.ms} ms</span>
          </span>
        )}
      </div>
      {result?.error?.isOffline && <OfflineNote error={result.error} />}
      {result?.error && !result.error.isOffline && (
        <pre className="demo-output">{JSON.stringify({ detail: result.error.detail }, null, 2)}</pre>
      )}
      {result && !result.error && (
        <pre className="demo-output">{result.data == null ? '(no body)' : JSON.stringify(result.data, null, 2)}</pre>
      )}
    </div>
  );
}
