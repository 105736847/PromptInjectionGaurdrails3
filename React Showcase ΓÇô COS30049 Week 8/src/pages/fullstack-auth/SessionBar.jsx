/**
 * SessionBar – the "who am I?" strip at the top of the demos on this page.
 *
 * Every demo reads the SAME <AuthProvider>, so logging in here logs you in
 * everywhere on the page – that is the whole point of a context.
 */
import { useState } from 'react';
import { LogIn, LogOut, TriangleAlert } from 'lucide-react';

import { DEMO_ACCOUNTS, useAuth } from './AuthContext.jsx';
import useNow from './useNow.js';
import { errorText, formatCountdown, initials, secondsUntil } from './authUtils.js';

export default function SessionBar() {
  const { user, expiresAt, notice, login, logout } = useAuth();
  const now = useNow(250); // the same tick as the Token expiry clock, so both agree
  const [busy, setBusy] = useState(null); // username currently logging in
  const [error, setError] = useState(null);

  async function quickLogin(account) {
    setBusy(account.username);
    setError(null);
    try {
      await login(account.username, account.password);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  if (user) {
    const secondsLeft = secondsUntil(expiresAt, now);
    return (
      <div className="auth-session auth-session-in">
        <span className="avatar auth-avatar-sm" aria-hidden="true">
          {initials(user.full_name)}
        </span>
        <span className="auth-session-text">
          Logged in as <strong>{user.full_name}</strong>{' '}
          <span className={`badge ${user.role === 'lecturer' ? 'badge-info' : 'badge-primary'}`}>{user.role}</span>
          <span className="muted small">
            {' '}
            · token {secondsLeft > 0 ? `expires in ${formatCountdown(secondsLeft)}` : 'has expired'}
          </span>
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => logout()}>
          <LogOut size={14} aria-hidden="true" /> Log out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-session">
      <span className="auth-session-text">
        {notice ? (
          <span className="auth-session-notice">
            <TriangleAlert size={15} aria-hidden="true" /> {notice}
          </span>
        ) : (
          <span className="muted">Not logged in – requests go out without a token.</span>
        )}
      </span>
      <span className="auth-session-actions">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.username}
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={busy !== null}
            onClick={() => quickLogin(account)}
          >
            {busy === account.username ? (
              <span className="spinner auth-spinner" aria-hidden="true" />
            ) : (
              <LogIn size={14} aria-hidden="true" />
            )}
            {account.label}
          </button>
        ))}
      </span>
      {error && (
        <p className="error-text auth-session-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
