import { useEffect, useSyncExternalStore } from 'react';
import { api } from '../api/client.js';

/**
 * useBackendStatus – is the FastAPI back end running?
 *
 *   const { status, info, refresh } = useBackendStatus();
 *   // status: 'checking' | 'online' | 'offline'
 *   // info:   the JSON from GET /api/health when online
 *
 * Every component that uses this hook shares ONE polling loop (a tiny
 * "external store"), so ten components don't send ten health requests.
 */
const POLL_MS = 15000;

let state = { status: 'checking', info: null, checkedAt: null };
const listeners = new Set();
let timer = null;
let inFlight = null;

function setState(next) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

async function check() {
  if (inFlight) return inFlight;
  inFlight = api
    .get('/api/health', { timeout: 4000 })
    .then((info) => setState({ status: 'online', info, checkedAt: new Date() }))
    .catch(() => setState({ status: 'offline', info: null, checkedAt: new Date() }))
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

function subscribe(listener) {
  listeners.add(listener);
  if (listeners.size === 1) {
    check();
    timer = setInterval(check, POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(timer);
  };
}

export default function useBackendStatus() {
  const snapshot = useSyncExternalStore(subscribe, () => state);

  // Check again as soon as the browser tab becomes visible.
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return { ...snapshot, refresh: check };
}
