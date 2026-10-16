import { useCallback, useEffect, useRef, useState } from 'react';
import { predictUrl } from './mlApi.js';

/**
 * usePrediction – call POST /api/ml/predict and keep only the LATEST answer.
 *
 *   const { result, error, loading, roundTripMs, sent, cancelled, predict } = usePrediction();
 *   predict('http://203.0.113.9/login', 0.5);
 *
 * When the user types quickly, several requests can be in flight and they may
 * come back in any order. Without care an OLD response could overwrite a newer
 * one ("race condition"). So every new call aborts the previous request with
 * its AbortController – the browser really cancels it – and a cancelled
 * request never updates state.
 */
export default function usePrediction() {
  const [state, setState] = useState({ result: null, error: null, loading: false, roundTripMs: null });
  const [counts, setCounts] = useState({ sent: 0, cancelled: 0 }); // requests sent / stale ones aborted
  const controllerRef = useRef(null); // the request currently in flight (if any)

  const predict = useCallback(async (url, threshold) => {
    const stale = controllerRef.current;
    stale?.abort(); // a newer request replaces the old one
    setCounts((c) => ({ sent: c.sent + 1, cancelled: c.cancelled + (stale ? 1 : 0) }));
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((s) => ({ ...s, loading: true }));

    const started = performance.now();
    try {
      const result = await predictUrl(url, threshold, { signal: controller.signal });
      setState({ result, error: null, loading: false, roundTripMs: performance.now() - started });
    } catch (error) {
      if (controller.signal.aborted) return; // stale: a newer call already took over
      setState({ result: null, error, loading: false, roundTripMs: null });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, []);

  // Cancel whatever is still running when the component unmounts.
  useEffect(() => () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  return { ...state, ...counts, predict };
}
