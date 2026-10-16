import { useEffect, useState } from 'react';
import useBackendStatus from '../../../hooks/useBackendStatus.js';

/**
 * useApiGet – load data from the back end with loading / error / data states.
 *
 *   const { data, loading, error, offline, reload } = useApiGet(getMetrics);
 *
 * `load` is one of the functions in mlApi.js; it receives { signal }.
 * The request waits until the shared health check says the back end is online,
 * so the demos fill themselves in as soon as you start uvicorn – no page reload.
 */
export default function useApiGet(load) {
  const { status, refresh } = useBackendStatus();
  const online = status === 'online';
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!online) return undefined;
    // Cancel the request if the component unmounts (or re-runs) before it finishes.
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    load({ signal: controller.signal })
      .then((data) => {
        // A cancelled request never updates state – not even if its answer arrives anyway
        // (a shared, cached request such as getExamples() is not cancelled by our signal).
        if (!controller.signal.aborted) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState((s) => ({ ...s, error, loading: false }));
      });
    return () => controller.abort();
  }, [load, online, reloadKey]);

  return {
    ...state,
    loading: online ? state.loading : status === 'checking',
    offline: status === 'offline',
    // Online: load again. Offline: ask the shared health check – the effect runs once it says "online".
    reload: () => (online ? setReloadKey((k) => k + 1) : refresh()),
  };
}
