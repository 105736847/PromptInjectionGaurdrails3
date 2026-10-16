/**
 * LoginForm – log in against FastAPI's OAuth2 "password flow".
 *
 * - The fields go to POST /api/auth/login as FORM data (see login() in AuthContext.jsx).
 * - On success the AuthProvider keeps the token → every other demo sees you as logged in.
 * - 401: wrong username OR password (the server deliberately doesn't say which).
 * - 429: too many failures – the server says how many seconds to wait; we count down.
 */
import { useState } from 'react';
import { Eye, EyeOff, LogIn, Skull } from 'lucide-react';

import { api } from '../../../api/client.js';
import { DEMO_ACCOUNTS, useAuth } from '../AuthContext.jsx';
import useNow from '../useNow.js';
import { errorText, secondsUntil, shortToken } from '../authUtils.js';

// The simulation never attacks the shared demo accounts: locking "student" for a minute
// would break every other demo on this page. A username that doesn't exist works just as
// well – the server rate-limits unknown names too (otherwise a lock would PROVE a name exists).
const ATTACK_TARGET = 'no_such_user';

export default function LoginForm() {
  const { user, token, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null); // { status, message }
  const [blocked, setBlocked] = useState(null); // { username, until } after a 429
  const [response, setResponse] = useState(null); // last successful /login response
  const [attack, setAttack] = useState([]); // results of the brute-force simulation
  const [attacking, setAttacking] = useState(false);
  const now = useNow(500);

  // Derived during render (no extra state): how long is the lock still active,
  // and does it apply to the username that is typed in right now?
  const typedName = username.trim().toLowerCase();
  const lockLeft = blocked ? secondsUntil(blocked.until, now) : 0;
  const secondsLocked = blocked?.username === typedName ? lockLeft : 0;

  async function submit(name, pass) {
    setSending(true);
    setError(null);
    try {
      setResponse(await login(name, pass));
      setPassword(''); // never keep a password around longer than needed
    } catch (err) {
      if (err.status === 429) {
        setBlocked({ username: name.trim().toLowerCase(), until: Date.now() + err.detail.retry_after * 1000 });
      }
      setError({ status: err.status, message: errorText(err) });
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submit(username, password);
  }

  function loginWithDemoAccount(account) {
    setUsername(account.username);
    setPassword(account.password);
    submit(account.username, account.password); // fill in AND log in with one click
  }

  // What an attacker's script would do: guess passwords as fast as possible.
  async function simulateAttack() {
    const isDemoAccount = DEMO_ACCOUNTS.some((account) => account.username === typedName);
    const target = typedName && !isDemoAccount ? typedName : ATTACK_TARGET;
    setAttack([]);
    setAttacking(true);
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        await api.post('/api/auth/login', new URLSearchParams({ username: target, password: `guess-${attempt}` }));
        setAttack((list) => [...list, { attempt, status: 200 }]);
      } catch (err) {
        setAttack((list) => [...list, { attempt, status: err.status || 'offline' }]);
        if (err.isOffline) break;
        if (err.status === 429) {
          setBlocked({ username: target, until: Date.now() + err.detail.retry_after * 1000 });
          setError({ status: 429, message: err.detail.message });
          setUsername(target);
          break;
        }
      }
    }
    setAttacking(false);
  }

  const errorId = 'login-error';

  return (
    <div className="grid-2 auth-login">
      <form className="stack" onSubmit={handleSubmit} noValidate>
        <div className="auth-chips" role="group" aria-label="Demo accounts">
          <span className="small muted">One-click demo accounts:</span>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.username}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => loginWithDemoAccount(account)}
              disabled={sending}
            >
              {account.username} / {account.password}
            </button>
          ))}
        </div>

        <div className="field">
          <label className="label" htmlFor="login-username">Username</label>
          <input
            id="login-username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="student"
            aria-invalid={error?.status === 401 || undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="login-password">Password</label>
          <div className="auth-password">
            <input
              id="login-password"
              className="input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-invalid={error?.status === 401 || undefined}
              aria-describedby={error ? errorId : undefined}
            />
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div id={errorId} className={`alert ${error.status === 429 ? 'alert-warning' : 'alert-danger'}`} role="alert">
            <span className="badge badge-code">{error.status || 'offline'}</span>
            <div>
              {error.status !== 429 && error.message}
              {error.status === 429 &&
                (lockLeft > 0 ? (
                  <>
                    Too many failed attempts for “{blocked.username}”. Try again in <strong>{lockLeft} s</strong>.
                  </>
                ) : (
                  'The lock has expired – you can try again now.'
                ))}
            </div>
          </div>
        )}

        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={sending || !username || !password || secondsLocked > 0}>
            {sending ? <span className="spinner auth-spinner" aria-hidden="true" /> : <LogIn size={16} aria-hidden="true" />}
            {sending ? 'Logging in…' : secondsLocked > 0 ? `Locked (${secondsLocked} s)` : 'Log in'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={simulateAttack} disabled={sending || attacking}>
            <Skull size={14} aria-hidden="true" /> Simulate 6 wrong guesses
          </button>
        </div>
        <p className="hint">
          The simulation guesses passwords for “{ATTACK_TARGET}” (or the name you typed – never the demo accounts,
          so the other demos keep working). The server allows 5 failures per minute for each username + IP address,
          and counts unknown usernames too, so a lock can’t reveal which usernames exist.
        </p>
      </form>

      <div className="stack-sm" aria-live="polite">
        {attack.length > 0 && (
          <div className="card card-subtle stack-sm">
            <strong className="small">Brute-force simulation</strong>
            <ol className="auth-attempts">
              {attack.map(({ attempt, status }) => (
                <li key={attempt} className={status === 429 ? 'is-blocked' : status === 200 ? 'is-ok' : ''}>
                  <span>#{attempt}</span> <strong>{status}</strong>
                </li>
              ))}
            </ol>
          </div>
        )}
        {user && response?.access_token === token ? (
          <>
            <p className="m-0 small">
              <span className="badge badge-success">200 OK</span> Logged in as <strong>{user.full_name}</strong>. The
              response body:
            </p>
            <pre className="demo-output">
              {JSON.stringify({ ...response, access_token: shortToken(response.access_token) }, null, 2)}
            </pre>
          </>
        ) : (
          <div className="card card-subtle small">
            <strong>What gets sent</strong>
            <pre className="demo-output mt-1">
              {`POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=${username ? encodeURIComponent(username) : '…'}&password=${password ? '•'.repeat(password.length) : '…'}`}
            </pre>
            <p className="m-0 mt-1 muted">
              Form data, not JSON – that is what OAuth2’s password flow (and the Authorize button in /api/docs)
              uses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
