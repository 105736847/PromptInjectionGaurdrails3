/**
 * client.js – one small wrapper around fetch() for talking to the FastAPI back end.
 *
 *   import { api, ApiError } from '../../api/client.js';
 *
 *   const students = await api.get('/api/students?page=1');
 *   const created  = await api.post('/api/students', { name: 'Mia' });
 *   const me       = await api.get('/api/auth/me', { token });
 *
 * Why a wrapper instead of calling fetch() everywhere?
 *  - one place for the base URL, JSON headers, auth header and timeout
 *  - fetch() does NOT throw for 404/422/500 – this wrapper does, with a useful message
 *  - FastAPI validation errors (422) are turned into { fieldName: message } for forms
 *  - "the back end isn't running" becomes a clear error instead of a confusing one
 */

// In development the Vite proxy forwards /api/* to http://localhost:8000 (see vite.config.js),
// so the base URL is empty. In production set VITE_API_URL=https://your-api.example.com
export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, detail = null, url = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 = network problem / back end offline / timeout
    this.detail = detail; // FastAPI's "detail" field (string or list of validation errors)
    this.url = url;
  }

  /** true when the request never reached a working back end */
  get isOffline() {
    return this.status === 0;
  }

  /**
   * FastAPI answers invalid input with 422 and a list like
   *   [{ loc: ['body', 'email'], msg: 'value is not a valid email address', type: '…' }]
   * This turns it into { email: 'value is not a valid email address' } for a form.
   */
  get fieldErrors() {
    if (this.status !== 422 || !Array.isArray(this.detail)) return {};
    const errors = {};
    for (const item of this.detail) {
      const field = item.loc?.[item.loc.length - 1];
      if (field !== undefined && !errors[field]) errors[field] = item.msg;
    }
    return errors;
  }
}

/** Build a readable message from FastAPI's error body. */
function messageFrom(status, detail) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => `${d.loc?.slice(1).join('.') || 'input'}: ${d.msg}`).join('; ');
  }
  return `Request failed with status ${status}`;
}

const OFFLINE_MESSAGE = 'Cannot reach the FastAPI back end. Is it running on port 8000?';

/**
 * apiFetch(path, options)
 *   method   'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
 *   body     a plain object (sent as JSON), FormData or URLSearchParams
 *   token    a JWT – adds "Authorization: Bearer <token>"
 *   timeout  milliseconds before giving up (default 10 s)
 *   signal   an AbortSignal, e.g. from a useEffect cleanup
 */
export async function apiFetch(path, { method = 'GET', body, token, timeout = 10000, signal, headers = {} } = {}) {
  const url = `${API_BASE}${path}`;
  const isFormLike = body instanceof FormData || body instanceof URLSearchParams;

  // Combine the caller's signal with our own timeout.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), timeout);
  const onAbort = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', onAbort);

  let response;
  try {
    response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isFormLike ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined || isFormLike ? body : JSON.stringify(body),
    });
  } catch (error) {
    if (signal?.aborted) throw error; // the caller cancelled – let them ignore it
    if (error.name === 'TimeoutError' || controller.signal.reason?.name === 'TimeoutError') {
      throw new ApiError(`The server took longer than ${timeout / 1000} s to answer.`, { url });
    }
    throw new ApiError(OFFLINE_MESSAGE, { url }); // DNS / connection refused / CORS …
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = response.status === 204 ? null : isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // The Vite dev proxy answers with an empty, non-JSON 5xx when FastAPI is not running.
    if (!isJson && response.status >= 500) throw new ApiError(OFFLINE_MESSAGE, { url });
    const detail = isJson ? data?.detail ?? data : data;
    throw new ApiError(messageFrom(response.status, detail), { status: response.status, detail, url });
  }
  return data;
}

/** Shorthands: api.get(path, options), api.post(path, body, options), … */
export const api = {
  get: (path, options) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiFetch(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiFetch(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => apiFetch(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiFetch(path, { ...options, method: 'DELETE' }),
};

/** WebSocket URL for a path, e.g. wsUrl('/api/ws/training') → ws://localhost:3000/api/ws/training */
export function wsUrl(path) {
  const base = API_BASE || window.location.origin;
  return base.replace(/^http/, 'ws') + path;
}
