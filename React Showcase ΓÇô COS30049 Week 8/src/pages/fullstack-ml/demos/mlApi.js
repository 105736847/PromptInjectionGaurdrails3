/**
 * mlApi.js – every call this page makes to the FastAPI model server, in one place.
 *
 * Components never build URLs or FormData themselves; they call these functions.
 * If an endpoint changes, this is the only file to edit – and it doubles as a
 * summary of the back end's API (compare it with backend/app/routers/ml.py).
 *
 * All functions return a Promise and throw an ApiError (see src/api/client.js)
 * with `status`, `detail`, `fieldErrors` and `isOffline` when something fails.
 */
import { api } from '../../../api/client.js';

/** GET /api/ml/info – version, features and limits of the loaded model. */
export const getModelInfo = (options) => api.get('/api/ml/info', options);

/** GET /api/ml/metrics – test-set metrics saved when the model was trained. */
export const getMetrics = (options) => api.get('/api/ml/metrics', options);

/**
 * GET /api/ml/examples – example URLs for the demo buttons.
 * Two demos need the same list, and it never changes while the server runs, so the
 * PROMISE is cached: both share one request. A failed request is forgotten, so the
 * next call (e.g. once the back end is started) tries again. The shared request is
 * not tied to one caller's `signal`: one demo unmounting must not cancel it for the other.
 */
let examplesRequest = null;
export function getExamples() {
  examplesRequest ??= api.get('/api/ml/examples').catch((error) => {
    examplesRequest = null;
    throw error;
  });
  return examplesRequest;
}

/**
 * POST /api/ml/predict – one URL → { probability, label, contributions, latency_ms, model_version }.
 * `signal` lets the caller cancel the request (e.g. when the user keeps typing).
 */
export const predictUrl = (url, threshold = 0.5, options) =>
  api.post('/api/ml/predict', { url, threshold }, options);

/**
 * POST /api/ml/predict/batch – upload a CSV file (multipart/form-data).
 * Passing FormData makes the client skip the JSON header; the browser then sets
 * "Content-Type: multipart/form-data; boundary=…" itself.
 */
export function predictBatch(file, threshold = 0.5, options) {
  const form = new FormData();
  form.append('file', file); // the name must match the parameter `file` in FastAPI
  form.append('threshold', String(threshold));
  return api.post('/api/ml/predict/batch', form, { timeout: 30000, ...options });
}
