/**
 * JwtInspector – what is inside a JSON Web Token, and why can't we fake one?
 *
 * 1. DECODE: split the token at the dots and base64url-decode the first two parts.
 *    This happens right here in the browser – no secret needed. (See jwt.js.)
 * 2. VERIFY: only the server can check the signature, because only it knows SECRET_KEY.
 * 3. TAMPER: change the payload but keep the old signature → the server says 401.
 */
import { useState } from 'react';
import { ShieldCheck, Skull } from 'lucide-react';

import { api } from '../../../api/client.js';
import { useAuth } from '../AuthContext.jsx';
import SessionBar from '../SessionBar.jsx';
import useNow from '../useNow.js';
import { decodeJwt, tamperWithPayload } from '../jwt.js';
import { errorText, formatCountdown, secondsUntil } from '../authUtils.js';

/** The token with its three parts in three colours (like jwt.io). */
function ColouredToken({ token, highlightPayload = false }) {
  const [header, payload, signature] = token.split('.');
  return (
    <p className="auth-token mono" aria-label="JSON Web Token">
      <span className="auth-jwt-header">{header}</span>
      <span className="auth-jwt-dot">.</span>
      <span className={`auth-jwt-payload${highlightPayload ? ' is-changed' : ''}`}>{payload}</span>
      <span className="auth-jwt-dot">.</span>
      <span className="auth-jwt-signature">{signature}</span>
    </p>
  );
}

const time = (seconds) => new Date(seconds * 1000).toLocaleTimeString();

/** The server's answer in three lines: what it checked, and token vs database. */
function Verdict({ info }) {
  const tokenName = info.claims.name;
  const databaseName = info.user_in_database.full_name;
  return (
    <ul className="auth-verdict small">
      <li>✓ Signature valid ({info.algorithm}) – the server re-computed it with SECRET_KEY</li>
      <li>✓ Not expired – {info.expires_in_seconds} s left</li>
      <li>
        Name in the token: “{tokenName}” · name in the database: “{databaseName}”
        {tokenName !== databaseName && <strong> – changed since login! Claims are a snapshot.</strong>}
      </li>
    </ul>
  );
}

export default function JwtInspector() {
  const { token, authFetch } = useAuth();
  const now = useNow(250); // same tick as the session bar above
  const [forged, setForged] = useState(null); // { from: original token, token, change }
  const [result, setResult] = useState(null); // { title, status, body, token: the token it is about }
  const [sending, setSending] = useState(null); // 'verify' | 'tamper'

  const decoded = decodeJwt(token);
  // A forged token – and the server's verdict – only belong to the token they were made
  // from. Log in again (or as someone else) and they no longer apply: derive, don't sync.
  const currentForgery = forged?.from === token ? forged : null;
  const currentResult = result?.token === token ? result : null;

  async function verifyOnServer() {
    setSending('verify');
    try {
      const body = await authFetch('/api/auth/token-info');
      setResult({ title: 'GET /api/auth/token-info with the REAL token', status: 200, body, token });
    } catch (err) {
      setResult({ title: 'GET /api/auth/token-info', status: err.status || 'offline', body: errorText(err), token });
    } finally {
      setSending(null);
    }
  }

  async function tamperAndSend() {
    const { role, exp } = decoded.payload;
    // Students try to become lecturers; lecturers try to make the token last a year.
    const change = role === 'lecturer' ? { exp: exp + 365 * 24 * 3600 } : { role: 'lecturer' };
    const forgedToken = tamperWithPayload(token, change);
    setForged({ from: token, token: forgedToken, change });
    setSending('tamper');
    try {
      // Plain api.get – NOT authFetch – so the expected 401 doesn't log YOU out.
      const body = await api.get('/api/auth/lecturer-only', { token: forgedToken });
      setResult({ title: 'GET /api/auth/lecturer-only with the FORGED token', status: 200, body, token });
    } catch (err) {
      setResult({
        title: 'GET /api/auth/lecturer-only with the FORGED token',
        status: err.status || 'offline',
        body: errorText(err),
        token,
      });
    } finally {
      setSending(null);
    }
  }

  if (!decoded) {
    return (
      <div className="stack">
        <SessionBar />
        <p className="muted m-0">
          Log in (above, or with a button in the bar) to get a token. This demo then splits it into its three parts
          and decodes them – right here in the browser, without any secret.
        </p>
      </div>
    );
  }

  const { header, payload } = decoded;
  const secondsLeft = secondsUntil(payload.exp * 1000, now); // exp is in seconds, now in ms

  return (
    <div className="stack">
      <SessionBar />

      <ColouredToken token={token} />

      <div className="grid-2">
        <section className="auth-part auth-part-header" aria-label="Header">
          <h4>Header <span className="muted small">algorithm &amp; token type</span></h4>
          <pre className="demo-output">{JSON.stringify(header, null, 2)}</pre>
        </section>
        <section className="auth-part auth-part-payload" aria-label="Payload">
          <h4>Payload <span className="muted small">the “claims”</span></h4>
          <pre className="demo-output">{JSON.stringify(payload, null, 2)}</pre>
          <dl className="auth-claims small">
            <dt><code>sub</code></dt><dd>subject – who the token is about</dd>
            <dt><code>iat</code></dt><dd>issued at {payload.iat ? time(payload.iat) : '–'}</dd>
            <dt><code>exp</code></dt>
            <dd>
              expires at {time(payload.exp)} –{' '}
              <strong className={secondsLeft > 0 ? '' : 'auth-text-danger'}>
                {secondsLeft > 0 ? `${formatCountdown(secondsLeft)} left` : 'expired'}
              </strong>
            </dd>
          </dl>
        </section>
      </div>

      <section className="auth-part auth-part-signature" aria-label="Signature">
        <h4>Signature</h4>
        <p className="m-0 small">
          <code>base64url( HMAC-SHA256( base64url(header) + &quot;.&quot; + base64url(payload), SECRET_KEY ) )</code>
        </p>
        <p className="m-0 mt-1 small">
          It is computed over the two coloured <em>strings</em> above, exactly as they are – change one character
          of the middle part and it no longer matches. The browser can’t check or recreate it, because it does not
          know <code>SECRET_KEY</code> (and must never know it).
        </p>
      </section>

      <div className="row">
        <button type="button" className="btn btn-primary" onClick={verifyOnServer} disabled={sending !== null}>
          {sending === 'verify' ? <span className="spinner auth-spinner" aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
          Ask the server to verify it
        </button>
        <button type="button" className="btn btn-danger" onClick={tamperAndSend} disabled={sending !== null}>
          {sending === 'tamper' ? <span className="spinner auth-spinner" aria-hidden="true" /> : <Skull size={16} aria-hidden="true" />}
          {payload.role === 'lecturer' ? 'Tamper: extend exp by a year' : 'Tamper: set role to “lecturer”'}
        </button>
      </div>

      {currentForgery && (
        <div className="stack-sm">
          <p className="m-0 small">
            <strong>Forged token</strong> – same header, same signature, new payload{' '}
            <code>{JSON.stringify(currentForgery.change)}</code>:
          </p>
          <ColouredToken token={currentForgery.token} highlightPayload />
        </div>
      )}

      {/* The live region is ALWAYS rendered: screen readers only announce changes inside a
          region that already existed – not a region that appears together with its text. */}
      <div aria-live="polite">
        {currentResult && (
          <div className="stack-sm">
            <p className="m-0 small">
              <span className={`badge ${currentResult.status === 200 ? 'badge-success' : 'badge-danger'}`}>
                {currentResult.status}
              </span>{' '}
              {currentResult.title}
            </p>
            {currentResult.body?.claims && <Verdict info={currentResult.body} />}
            <pre className="demo-output">
              {typeof currentResult.body === 'string' ? currentResult.body : JSON.stringify(currentResult.body, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
