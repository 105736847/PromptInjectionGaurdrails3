/**
 * RoleGate – student vs lecturer: hiding a button is NOT security.
 *
 * GET /api/auth/lecturer-only uses Depends(require_role("lecturer")) in FastAPI:
 *   no token → 401, student token → 403, lecturer token → 200.
 * The switch hides the button from students – purely cosmetic. The endpoint is
 * still one curl command away, so the SERVER must enforce the rule.
 */
import { useState } from 'react';
import { Check, Copy, GraduationCap, ShieldX } from 'lucide-react';

import { API_BASE } from '../../../api/client.js';
import { useAuth } from '../AuthContext.jsx';
import SessionBar from '../SessionBar.jsx';
import { errorText, shortToken } from '../authUtils.js';

export default function RoleGate() {
  const { user, token, authFetch } = useAuth();
  const [hideForStudents, setHideForStudents] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { token, as, status, data?, message? }
  const [copied, setCopied] = useState(false);

  const isLecturer = user?.role === 'lecturer';
  const showButton = isLecturer || !hideForStudents; // UI decision only!
  // An answer only belongs to the token it was requested with. After switching account,
  // a student's old 403 must not sit under the lecturer's name – derive, don't sync.
  const currentResult = result?.token === token ? result : null;

  async function callEndpoint() {
    setLoading(true);
    const as = user ? `${user.full_name} (${user.role})` : 'nobody (no token)';
    try {
      const data = await authFetch('/api/auth/lecturer-only');
      setResult({ token, as, status: 200, data });
    } catch (err) {
      setResult({ token, as, status: err.status || 'offline', message: errorText(err) });
    } finally {
      setLoading(false);
    }
  }

  const origin = API_BASE || window.location.origin;
  const curl = (shown) =>
    `curl ${origin}/api/auth/lecturer-only \\\n  -H "Authorization: Bearer ${shown}"`;

  async function copyCurl() {
    try {
      await navigator.clipboard.writeText(curl(token ?? '<token>'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked – ignore */
    }
  }

  return (
    <div className="stack">
      <SessionBar />

      <label className="switch">
        <input type="checkbox" checked={hideForStudents} onChange={(e) => setHideForStudents(e.target.checked)} />
        <span className="switch-track" />
        Hide the button from students (UI only)
      </label>

      {showButton ? (
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={callEndpoint} disabled={loading}>
            {loading ? <span className="spinner auth-spinner" aria-hidden="true" /> : <GraduationCap size={16} aria-hidden="true" />}
            Load class summary
          </button>
          <code className="small">GET /api/auth/lecturer-only</code>
        </div>
      ) : (
        <div className="auth-hidden stack-sm">
          <p className="m-0 small">
            <strong>Button hidden for students.</strong> But the endpoint still exists – anyone with a token can call
            it from a terminal:
          </p>
          <pre className="demo-output">{curl(token ? shortToken(token) : '<log in first>')}</pre>
          <div className="row">
            <button type="button" className="btn btn-sm" onClick={copyCurl}>
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy the full command'}
            </button>
            <button type="button" className="btn btn-sm btn-danger" onClick={callEndpoint} disabled={loading}>
              {loading && <span className="spinner auth-spinner" aria-hidden="true" />}
              Call it anyway (like curl would)
            </button>
          </div>
        </div>
      )}

      <div aria-live="polite">{currentResult && <RoleResult result={currentResult} />}</div>
    </div>
  );
}

function RoleResult({ result }) {
  if (result.status !== 200) {
    const explain = {
      401: '401 = “I don’t know who you are” – no token, or a bad one.',
      403: '403 = “I know who you are, but you may not do this” – the token is valid, the role is wrong.',
    }[result.status];
    return (
      <div className={`alert ${result.status === 403 ? 'alert-danger' : 'alert-warning'}`} role="alert">
        <ShieldX size={18} aria-hidden="true" />
        <div>
          <strong>
            {result.status === 'offline' ? 'No answer from the server' : `${result.status} as ${result.as}`}
          </strong>
          <p className="m-0">{result.message}</p>
          {explain && <p className="m-0 small">{explain}</p>}
        </div>
      </div>
    );
  }

  const { data } = result;
  return (
    <div className="stack-sm">
      <p className="m-0 small">
        <span className="badge badge-success">200</span> as {result.as} – {data.unit_code} {data.unit_name}
      </p>
      <div className="auth-stats">
        <div className="card card-subtle">
          <span className="small muted">Enrolled</span>
          <strong>{data.enrolled}</strong>
        </div>
        <div className="card card-subtle">
          <span className="small muted">At risk</span>
          <strong>{data.at_risk}</strong>
        </div>
      </div>
      <div className="table-wrap">
        {/* auth-summary + data-label: on phones each row becomes a small card (see auth.css) */}
        <table className="table small auth-summary">
          <thead>
            <tr>
              <th scope="col">Assessment</th>
              <th scope="col" className="num">Due (week)</th>
              <th scope="col" className="num">Submitted</th>
              <th scope="col" className="num">Average</th>
            </tr>
          </thead>
          <tbody>
            {data.assessments.map((item) => (
              <tr key={item.name}>
                <th scope="row">{item.name}</th>
                <td className="num" data-label="Due (week)">{item.due_week}</td>
                <td className="num" data-label="Submitted">{item.submitted}</td>
                <td className="num" data-label="Average">{item.average_mark ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
