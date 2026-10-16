/**
 * useRequest – the bookkeeping every demo on this page needs around one API call:
 * a loading flag, how long it took, "only the newest request counts", and
 * cancelling the request if the component disappears (unmount).
 *
 *   const { send, loading, request, result } = useRequest();
 *   const outcome = await send('GET', path, (signal) => api.get(path, { signal }));
 *   // outcome / result: { status, ms, data }  or  { status, ms, error }  (error = ApiError)
 *
 * Why pass okStatus? client.js resolves with the BODY only, so for a success we
 * record the status code the endpoint is declared with (e.g. status_code=201).
 *
 * useRequest({ keepPrevious: true }) keeps showing the last result while the next
 * request runs – nicer for lists that reload on every keystroke (no flicker).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useRequest({ keepPrevious = false } = {}) {
  const [request, setRequest] = useState(null); // { method, path } of the latest call
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef(null);

  // Unmount → abort whatever is still in flight (StrictMode runs this once in dev too).
  useEffect(() => () => controllerRef.current?.abort(), []);

  const send = useCallback(async (method, path, call, okStatus = 200) => {
    controllerRef.current?.abort(); // a new request replaces an older one
    const controller = new AbortController();
    controllerRef.current = controller;

    setRequest({ method, path });
    if (!keepPrevious) setResult(null);
    setLoading(true);
    const started = performance.now();
    let outcome;
    try {
      const data = await call(controller.signal);
      outcome = { status: okStatus, ms: Math.round(performance.now() - started), data };
    } catch (error) {
      if (controller.signal.aborted) return null; // cancelled on purpose → ignore
      outcome = { status: error.status, ms: Math.round(performance.now() - started), error };
    }
    // Ignore stale answers: only the newest request may update the screen.
    if (controllerRef.current !== controller) return null;
    setResult(outcome);
    setLoading(false);
    return outcome;
  }, [keepPrevious]);

  return { send, loading, request, result };
}
