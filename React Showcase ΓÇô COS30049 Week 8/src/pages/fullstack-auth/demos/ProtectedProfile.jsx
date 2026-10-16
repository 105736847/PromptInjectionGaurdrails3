/**
 * ProtectedProfile – read and change data that needs a login.
 *
 * GET /api/auth/me and PATCH /api/auth/me depend on `CurrentUser` in FastAPI.
 * authFetch() (from the AuthProvider) adds "Authorization: Bearer <token>".
 * Without a token there is no header → FastAPI answers 401 before our code even runs.
 */
import { useEffect, useState } from 'react';
import { Save, Send } from 'lucide-react';

import { api } from '../../../api/client.js';
import { useAuth } from '../AuthContext.jsx';
import SessionBar from '../SessionBar.jsx';
import { cleanFieldErrors, errorText, initials, shortToken } from '../authUtils.js';

export default function ProtectedProfile() {
  const { token, authFetch, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [anonymousResult, setAnonymousResult] = useState(null);
  const [sendingAnonymous, setSendingAnonymous] = useState(false);

  // Load the profile whenever the token changes (log in, log out, switch account).
  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    setProfile(null); // don't show the previous account's data while loading
    setLoading(true);
    setLoadError(null);
    authFetch('/api/auth/me', { signal: controller.signal })
      .then(setProfile)
      .catch((err) => {
        if (!controller.signal.aborted) setLoadError(errorText(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort(); // cancel if the token changes or we unmount
  }, [token, authFetch]);

  async function callWithoutToken() {
    setSendingAnonymous(true);
    try {
      await api.get('/api/auth/me'); // no token option → no Authorization header
      setAnonymousResult({ status: 200, message: 'Unexpected: the server accepted it.' });
    } catch (err) {
      setAnonymousResult({ status: err.status || 'offline', message: errorText(err) });
    } finally {
      setSendingAnonymous(false);
    }
  }

  function handleSaved(updated) {
    setProfile(updated);
    updateUser(updated); // keep the AuthProvider's copy (shown in the session bars) in sync
  }

  const request = `GET /api/auth/me
Authorization: ${token ? `Bearer ${shortToken(token)}` : '(missing)'}`;

  if (!token) {
    return (
      <div className="stack">
        <SessionBar />
        <div className="grid-2">
          <div className="stack-sm">
            <strong className="small">The request React would send</strong>
            <pre className="demo-output">{request}</pre>
            <div>
              <button type="button" className="btn" onClick={callWithoutToken} disabled={sendingAnonymous}>
                {sendingAnonymous ? (
                  <span className="spinner auth-spinner" aria-hidden="true" />
                ) : (
                  <Send size={16} aria-hidden="true" />
                )}
                {sendingAnonymous ? 'Sending…' : 'Send it anyway'}
              </button>
            </div>
          </div>
          <div className="stack-sm small" aria-live="polite">
            {anonymousResult ? (
              <div className="alert alert-danger" role="alert">
                <span className="badge badge-code">{anonymousResult.status}</span>
                <div>{anonymousResult.message}</div>
              </div>
            ) : (
              <p className="m-0 muted">Press “Send it anyway” to see the server’s answer.</p>
            )}
            <p className="m-0">
              <strong>What’s missing?</strong> The <code>Authorization</code> header. FastAPI’s{' '}
              <code>OAuth2PasswordBearer</code> finds no token, <code>get_current_user</code> raises{' '}
              <code>401 Unauthorized</code>, and the endpoint function never runs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <SessionBar />
      <div className="grid-2">
        <div className="stack-sm">
          <strong className="small">The request authFetch() sends</strong>
          <pre className="demo-output">{request}</pre>
          {loading && (
            <p className="row small muted m-0" role="status">
              <span className="spinner auth-spinner" aria-hidden="true" /> Loading your profile…
            </p>
          )}
          {loadError && (
            <p className="alert alert-danger m-0" role="alert">
              {loadError}
            </p>
          )}
        </div>
        {/* key: switching account gives a fresh editor with a fresh input value */}
        {profile && <ProfileCard key={profile.id} profile={profile} onSaved={handleSaved} />}
      </div>
    </div>
  );
}

function ProfileCard({ profile, onSaved }) {
  const { authFetch } = useAuth();
  const [fullName, setFullName] = useState(profile.full_name);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState(null); // 422: something is wrong with the NAME
  const [requestError, setRequestError] = useState(null); // offline, 500 …: the name is fine
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFieldError(null);
    setRequestError(null);
    try {
      const updated = await authFetch('/api/auth/me', { method: 'PATCH', body: { full_name: fullName } });
      onSaved(updated);
      setFullName(updated.full_name); // the server trimmed the spaces – show its version
      setSaved(true);
    } catch (err) {
      // Only a 422 is about the input. Anything else must not mark a valid name as invalid.
      if (err.status === 422) setFieldError(cleanFieldErrors(err.fieldErrors).full_name ?? err.message);
      else setRequestError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="card stack-sm">
      <div className="auth-profile-head">
        <span className="avatar" aria-hidden="true">{initials(profile.full_name)}</span>
        <div>
          <strong>{profile.full_name}</strong>
          <p className="m-0 small muted">
            @{profile.username} · <span className="badge">{profile.role}</span> · member since{' '}
            <time dateTime={profile.created_at}>{new Date(profile.created_at).toLocaleDateString()}</time>
          </p>
        </div>
      </div>
      <form className="stack-sm" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="profile-name">Full name</label>
          <input
            id="profile-name"
            className="input"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setSaved(false);
            }}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? 'profile-name-error' : undefined}
            disabled={saving}
          />
          {fieldError && (
            <p className="error-text" id="profile-name-error" role="alert">
              {fieldError}
            </p>
          )}
        </div>
        {requestError && (
          <p className="alert alert-danger m-0" role="alert">
            {requestError}
          </p>
        )}
        <div className="row">
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving || fullName === profile.full_name}>
            {saving ? <span className="spinner auth-spinner" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save (PATCH)'}
          </button>
        </div>
      </form>
      {saved && (
        <p className="hint" role="status">
          Saved. Your JWT still says the old <code>name</code> – claims are frozen at login. Check it in “What’s
          inside a JWT” → “Ask the server to verify it”.
        </p>
      )}
    </article>
  );
}
