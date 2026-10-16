/**
 * TokenExpiry – short-lived tokens, and what happens when one runs out.
 *
 * 1. Log in with a 1-minute token (POST /api/auth/login?minutes=1 – a demo-only option).
 * 2. Watch the countdown. It is DERIVED from the token's "exp" claim on every render.
 * 3. After "exp", the next request gets 401 → authFetch() logs you out automatically.
 *
 * Real apps keep access tokens short (5–30 min) and either ask the user to log in
 * again or silently get a new one with a longer-lived "refresh token".
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Hourglass, Send, Timer } from 'lucide-react';

import { useAuth } from '../AuthContext.jsx';
import SessionBar from '../SessionBar.jsx';
import useNow from '../useNow.js';
import { errorText, formatCountdown, secondsUntil } from '../authUtils.js';

export default function TokenExpiry() {
  const { token, expiresAt, lifetime, notice, login, authFetch } = useAuth();
  const now = useNow(250);
  const [autoCheck, setAutoCheck] = useState(true);
  const [busy, setBusy] = useState(null); // 'login' | 'request' | null
  const [log, setLog] = useState([]);
  const nextId = useRef(1); // a counter that survives re-renders without causing one

  const addLog = useCallback((text, tone) => {
    const entry = { id: nextId.current++, time: new Date().toLocaleTimeString(), text, tone };
    setLog((current) => [entry, ...current].slice(0, 8)); // newest first, keep 8
  }, []);

  async function loginShort() {
    setBusy('login');
    try {
      const data = await login('student', 'student123', { minutes: 1 });
      addLog(`Logged in as student – the token is valid for ${data.expires_in} s`, 'success');
    } catch (err) {
      addLog(`Login failed: ${errorText(err)}`, 'danger');
    } finally {
      setBusy(null);
    }
  }

  const callApi = useCallback(
    async (trigger) => {
      setBusy('request');
      try {
        const me = await authFetch('/api/auth/me');
        addLog(`${trigger}: GET /api/auth/me → 200 (hello, ${me.full_name})`, 'success');
      } catch (err) {
        const loggedOut = err.status === 401 && token ? ' → AuthProvider logged you out' : '';
        addLog(`${trigger}: GET /api/auth/me → ${err.status || 'offline'}: ${errorText(err)}${loggedOut}`, 'danger');
      } finally {
        setBusy(null);
      }
    },
    [authFetch, addLog, token],
  );

  // Optional: send a request 1 s after "exp", so nobody has to click at the right moment.
  useEffect(() => {
    if (!autoCheck || !token || !expiresAt) return undefined;
    const delay = Math.max(0, expiresAt - Date.now() + 1000);
    const id = setTimeout(() => callApi('Auto-check'), delay);
    return () => clearTimeout(id); // new token / switch off / unmount → cancel the old timer
  }, [autoCheck, token, expiresAt, callApi]);

  // Derived on every render from "exp" and the clock – no countdown state to keep in sync.
  const secondsLeft = token ? secondsUntil(expiresAt, now) : 0; // whole seconds, like the session bar
  const exactLeft = token ? Math.max(0, (expiresAt - now) / 1000) : 0; // smooth, for the progress bar
  const fraction = token && lifetime ? Math.min(1, exactLeft / lifetime) : 0;
  const tone = fraction > 0.5 ? 'ok' : fraction > 0.2 ? 'warn' : 'danger';

  return (
    <div className="stack">
      <SessionBar />

      <div className="row">
        <button type="button" className="btn btn-primary" onClick={loginShort} disabled={busy !== null}>
          {busy === 'login' ? <span className="spinner auth-spinner" aria-hidden="true" /> : <Timer size={16} aria-hidden="true" />}
          Log in with a 1-minute token
        </button>
        <button type="button" className="btn" onClick={() => callApi('Manual')} disabled={busy !== null}>
          {busy === 'request' ? <span className="spinner auth-spinner" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
          Call GET /api/auth/me now
        </button>
      </div>

      <label className="switch">
        <input type="checkbox" checked={autoCheck} onChange={(e) => setAutoCheck(e.target.checked)} />
        <span className="switch-track" />
        Automatically call the API 1 s after the token expires
      </label>

      <div className={`auth-clock auth-clock-${token ? tone : 'none'}`}>
        <Hourglass size={22} aria-hidden="true" />
        {token ? (
          <div className="auth-clock-body">
            <p className="m-0">
              <strong className="auth-clock-time" role="timer" aria-live="off">
                {formatCountdown(secondsLeft)}
              </strong>{' '}
              <span className="small muted">
                {secondsLeft > 0
                  ? `until exp (${new Date(expiresAt).toLocaleTimeString()})`
                  : 'expired – the server will now reject this token'}
              </span>
            </p>
            <div
              className="auth-bar"
              role="progressbar"
              aria-label="Token lifetime left"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(fraction * 100)}
            >
              <span style={{ width: `${fraction * 100}%` }} />
            </div>
          </div>
        ) : (
          <p className="m-0 small">
            {notice
              ? 'The token is gone – after the 401 the AuthProvider forgot it. Log in again to restart the clock.'
              : 'No token. Log in with a 1-minute token to start the clock.'}
          </p>
        )}
      </div>

      {/* The live region is always rendered, so even the FIRST log entry is announced */}
      <div aria-live="polite">
        {log.length > 0 && (
          <ol className="auth-log" aria-label="What happened">
            {log.map((entry) => (
              <li key={entry.id} className={`auth-log-${entry.tone}`}>
                <time>{entry.time}</time> <span>{entry.text}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
