/**
 * useStudents(params, options) – load one page of students from FastAPI.
 *
 *   const { data, error, loading, refetch } = useStudents({ q: 'chen', page: 2 });
 *   // data = { items: [...], total, page, page_size, pages }
 *
 * What this hook does that a naive "fetch in useEffect" does not:
 *  1. Cancels the previous request when params change   (AbortController)
 *  2. Ignores a response that arrives for OLD params     (stale-response guard)
 *  3. Keeps the previous rows while the next page loads  (no flicker)
 *  4. refetch() on demand, and again whenever another demo changed the data
 *  5. Retries by itself when the back end comes back online (useBackendStatus)
 *  6. Cleans up on unmount (StrictMode mounts → unmounts → mounts in development)
 *
 * The options `abort`, `ignoreStale` and `latency` exist only so the
 * "reusable data hook" demo can switch the protections off and show the bugs.
 * In your own project keep the defaults (or delete the options).
 */
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { api } from '../../../api/client.js';
import useBackendStatus from '../../../hooks/useBackendStatus.js';
import { toQueryString } from './studentsApi.js';
import { useStudentsData } from './StudentsData.jsx';

/**
 * useRetryWhenBackOnline(error, retry) – a request failed because the server was
 * down; as soon as the shared health check sees it again ("Check again" in the
 * banner, or the 15 s poll), call retry(). Used by useStudents and the stats demo.
 */
export function useRetryWhenBackOnline(error, retry) {
  const { status } = useBackendStatus();
  const offline = Boolean(error?.isOffline);
  useEffect(() => {
    // Booleans as deps: a NEW offline error while still offline does not retry again.
    if (offline && status === 'online') retry();
  }, [offline, status, retry]);
}

/** Wait `ms`, but stop early (reject) if the signal is aborted. */
function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
  });
}

export default function useStudents(params, { abort = true, ignoreStale = true, latency = 0, onEvent } = {}) {
  const { version } = useStudentsData(); // bumps after any create/update/delete on the page
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ data: null, dataUrl: null, error: null, loading: true });
  const requestCounter = useRef(0);

  // A string is a stable effect dependency. An object like `params` is a NEW
  // object on every render, which would start a new request on every render!
  const url = `/api/students${toQueryString(params)}`;

  // useEffectEvent (React 19.2+): always calls the LATEST onEvent without being
  // an effect dependency – changing the logger must not trigger a new request.
  const emit = useEffectEvent((event) => onEvent?.(event));

  useEffect(() => {
    const controller = new AbortController();
    const signal = abort ? controller.signal : undefined;
    let isCurrent = true; // set to false by the cleanup → any later response is stale
    const id = ++requestCounter.current;
    const started = performance.now();
    const elapsed = () => Math.round(performance.now() - started);

    setState((s) => ({ ...s, loading: true })); // keep the old data on screen (dimmed)
    emit({ id, url, type: 'start' });

    (async () => {
      try {
        if (latency) await wait(Math.random() * latency, signal); // teaching aid: a slow network
        const data = await api.get(url, { signal });
        if (!isCurrent && ignoreStale) {
          emit({ id, url, type: 'stale', ms: elapsed() }); // params changed meanwhile → throw away
          return;
        }
        setState({ data, dataUrl: url, error: null, loading: false });
        emit({ id, url, type: 'success', ms: elapsed(), stale: !isCurrent, total: data.total });
      } catch (error) {
        if (controller.signal.aborted) {
          emit({ id, url, type: 'aborted', ms: elapsed() }); // we cancelled it on purpose – not an error
          return;
        }
        if (!isCurrent && ignoreStale) return;
        setState((s) => ({ ...s, error, loading: false })); // keep old data, show the error
        emit({ id, url, type: 'error', ms: elapsed(), message: error.message });
      }
    })();

    // Cleanup runs before the next request starts and when the component unmounts.
    return () => {
      isCurrent = false;
      if (abort) controller.abort();
    };
  }, [url, version, reloadKey, abort, ignoreStale, latency]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);
  useRetryWhenBackOnline(state.error, refetch);

  return { ...state, refetch, url };
}
