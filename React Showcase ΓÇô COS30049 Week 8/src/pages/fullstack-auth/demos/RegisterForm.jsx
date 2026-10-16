/**
 * RegisterForm – sign up, show the rules live, map server errors onto fields,
 * then log in automatically.
 *
 * The browser checks are for a pleasant UX; the server checks (Pydantic in
 * auth.py) are for SECURITY – anyone can skip the browser. Switch "Check in the
 * browser first" off to send anything and watch FastAPI's 422 land on the fields.
 */
import { useEffect, useState } from 'react';
import { Circle, CircleCheck, UserPlus } from 'lucide-react';

import { api } from '../../../api/client.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { useAuth } from '../AuthContext.jsx';
import { cleanFieldErrors, errorText } from '../authUtils.js';

// Same rules as RegisterRequest in backend/app/routers/auth.py – keep them in sync.
const RULES = {
  username: [
    { label: '3–32 characters', message: 'Use 3–32 characters.', test: (v) => v.length >= 3 && v.length <= 32 },
    {
      label: 'only a–z, 0–9 and _',
      message: 'Use only lowercase letters, digits and underscores.',
      test: (v) => /^[a-z0-9_]+$/.test(v),
    },
  ],
  password: [
    { label: 'at least 8 characters', message: 'Use at least 8 characters.', test: (v) => v.length >= 8 },
    { label: 'a letter', message: 'Add at least one letter.', test: (v) => /[A-Za-z]/.test(v) },
    { label: 'a digit', message: 'Add at least one digit.', test: (v) => /\d/.test(v) },
  ],
  full_name: [{ label: 'not empty', message: 'Please enter your name.', test: (v) => v.trim().length > 0 }],
};

const EMPTY = { username: '', full_name: '', password: '' };
const FIELD_ORDER = ['username', 'full_name', 'password']; // top to bottom, as on screen

function RuleList({ rules, value }) {
  return (
    <ul className="auth-rules">
      {rules.map((rule) => {
        const ok = rule.test(value);
        return (
          <li key={rule.label} className={ok ? 'is-ok' : ''}>
            {ok ? <CircleCheck size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
            {rule.label}
            <span className="visually-hidden">{ok ? ' (done)' : ' (not yet)'}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function RegisterForm() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [checkInBrowser, setCheckInBrowser] = useState(true);
  const [errors, setErrors] = useState({}); // { field: { message, source: 'browser' | 'server' } }
  const [sending, setSending] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [created, setCreated] = useState(null); // the 201 response body
  const [focusRequest, setFocusRequest] = useState(null); // { field } – a new object every time

  // After a failed submit, move focus to the first field with an error, so keyboard and
  // screen-reader users land on it (the screen reader reads the label AND the error text,
  // linked by aria-describedby). An effect, because the enabled input and its error
  // message only exist in the DOM AFTER React has rendered this update.
  useEffect(() => {
    if (focusRequest) document.getElementById(`register-${focusRequest.field}`)?.focus();
  }, [focusRequest]);

  function showErrors(found) {
    setErrors(found);
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) setFocusRequest({ field: first });
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current }; // copy – never mutate state
      delete next[field]; // editing a field clears its error
      return next;
    });
  }

  function browserErrors() {
    const found = {};
    for (const [field, rules] of Object.entries(RULES)) {
      const broken = rules.find((rule) => !rule.test(form[field]));
      if (broken) found[field] = { message: broken.message, source: 'browser' };
    }
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setGeneralError(null);
    setCreated(null);
    if (checkInBrowser) {
      const found = browserErrors();
      showErrors(found);
      if (Object.keys(found).length > 0) return; // don't bother the server
    }

    setSending(true);
    try {
      const user = await api.post('/api/auth/register', form); // → 201 Created
      setCreated(user);
      await login(form.username, form.password); // auto-login with the same credentials
      showToast({ type: 'success', title: `Welcome, ${user.full_name}!`, message: 'Account created and logged in.' });
      setForm(EMPTY);
      setErrors({});
    } catch (err) {
      if (err.status === 422) {
        // FastAPI's list of errors → { username: '…', password: '…' } → shown under each field
        const server = cleanFieldErrors(err.fieldErrors);
        showErrors(Object.fromEntries(Object.entries(server).map(([f, m]) => [f, { message: m, source: 'server' }])));
      } else if (err.status === 409) {
        showErrors({ username: { message: err.message, source: 'server' } });
      } else {
        setGeneralError(errorText(err));
      }
    } finally {
      setSending(false);
    }
  }

  function renderError(field) {
    const error = errors[field];
    if (!error) return null;
    return (
      <p className="error-text" id={`register-${field}-error`}>
        <span className={`badge auth-source ${error.source === 'server' ? 'badge-danger' : ''}`}>{error.source}</span>{' '}
        {error.message}
      </p>
    );
  }

  const fieldProps = (field) => ({
    id: `register-${field}`,
    className: 'input',
    value: form[field],
    onChange: (e) => update(field, e.target.value),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `register-${field}-error` : undefined,
    disabled: sending,
  });

  return (
    <div className="grid-2 auth-register">
      <form className="stack" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="register-username">
            Username <span className="required">*</span>
          </label>
          <input {...fieldProps('username')} autoComplete="username" placeholder="e.g. jamie_lee" />
          <RuleList rules={RULES.username} value={form.username} />
          {renderError('username')}
        </div>
        <div className="field">
          <label className="label" htmlFor="register-full_name">
            Full name <span className="required">*</span>
          </label>
          <input {...fieldProps('full_name')} autoComplete="name" placeholder="e.g. Jamie Lee" />
          {renderError('full_name')}
        </div>
        <div className="field">
          <label className="label" htmlFor="register-password">
            Password <span className="required">*</span>
          </label>
          <input {...fieldProps('password')} type="password" autoComplete="new-password" />
          <RuleList rules={RULES.password} value={form.password} />
          {renderError('password')}
        </div>

        <label className="switch">
          <input type="checkbox" checked={checkInBrowser} onChange={(e) => setCheckInBrowser(e.target.checked)} />
          <span className="switch-track" />
          Check in the browser first
        </label>

        {generalError && (
          <p className="alert alert-danger m-0" role="alert">
            {generalError}
          </p>
        )}

        <div>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? <span className="spinner auth-spinner" aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
            {sending ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </form>

      <div className="stack-sm" aria-live="polite">
        {created ? (
          <>
            <p className="m-0 small">
              <span className="badge badge-success">201 Created</span> and logged in automatically. Notice what is{' '}
              <em>not</em> in the response:
            </p>
            <pre className="demo-output">{JSON.stringify(created, null, 2)}</pre>
            <p className="hint">
              No <code>password</code>, no <code>hashed_password</code> – <code>response_model=UserPublic</code> filters
              them out.
            </p>
          </>
        ) : (
          <div className="card card-subtle small stack-sm">
            <strong>Things to try</strong>
            <ul className="m-0">
              <li>
                Username <code>student</code> → <span className="badge badge-code">409 Conflict</span> (already taken)
              </li>
              <li>
                Switch the browser check off, type <code>Bad Name!</code> and password <code>short</code> →{' '}
                <span className="badge badge-code">422</span> errors from Pydantic appear under the fields
              </li>
              <li>A valid form → 201, then an automatic login – look at the session bars further down</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
