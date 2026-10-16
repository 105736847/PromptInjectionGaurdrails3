/**
 * StatusCodes – press a code, FastAPI answers with it, and you see what
 * client.js turned the answer into. The table below is a cheat sheet.
 *
 * fetch() itself only fails when the network fails; a 404 or 500 is still a
 * "successful" fetch. client.js checks response.ok and THROWS an ApiError for
 * every 4xx/5xx, so your React code can use one try/catch for all problems.
 */
import { useState } from 'react';
import { Bug, CircleCheck, CircleX } from 'lucide-react';

import { api } from '../../../api/client.js';
import useRequest from './useRequest.js';
import { OfflineNote, STATUS_TEXT, StatusBadge } from './ResponseView.jsx';

const CODES = [
  { code: 200, when: 'It worked – here is the data.', fastapi: 'return {...}', ui: 'Show the data.' },
  { code: 201, when: 'A POST created something new.', fastapi: 'status_code=201', ui: 'Show the new item / “Saved”.' },
  { code: 204, when: 'Success with nothing to send back (DELETE).', fastapi: 'Response(status_code=204)', ui: 'No body – don’t parse JSON.' },
  { code: 400, when: 'Input is valid JSON but breaks a business rule.', fastapi: 'raise HTTPException(400, …)', ui: 'Show detail next to the form.' },
  { code: 401, when: 'Not logged in, or the token expired.', fastapi: 'raise HTTPException(401, …)', ui: 'Send the user to the login page.' },
  { code: 403, when: 'Logged in, but not allowed to do this.', fastapi: 'raise HTTPException(403, …)', ui: 'Explain; hide the button next time.' },
  { code: 404, when: 'The thing doesn’t exist.', fastapi: 'raise HTTPException(404, …)', ui: 'Show a “not found” message.' },
  { code: 409, when: 'Clashes with existing data (duplicate email).', fastapi: 'raise HTTPException(409, …)', ui: 'Ask the user to change the value.' },
  { code: 418, when: 'A 1998 April Fools’ joke. Never use it!', fastapi: 'raise HTTPException(418, …)', ui: 'Smile.' },
  { code: 422, when: 'Input failed validation – FastAPI sends it for you.', fastapi: 'automatic (Pydantic)', ui: 'Show error.fieldErrors on the form.', path: '/api/basics/status/not-a-number' },
  { code: 429, when: 'Too many requests – slow down.', fastapi: 'raise HTTPException(429, …)', ui: 'Wait (Retry-After), then retry.' },
  { code: 500, when: 'Something broke on the server.', fastapi: 'raise HTTPException(500, …)', ui: 'Apologise, offer “Try again”.' },
  { code: 'bug', when: 'An exception nobody caught (a real bug).', fastapi: 'main.py’s exception handler', ui: 'Same as 500 – check the server log.', path: '/api/basics/crash' },
];

/** The properties of an ApiError worth looking at (getters are not copied by JSON.stringify). */
function describeError(error) {
  const { name, status, message, detail, isOffline, fieldErrors } = error;
  return JSON.stringify({ name, status, message, detail, isOffline, fieldErrors }, null, 2);
}

export default function StatusCodes() {
  const [picked, setPicked] = useState(null);
  const { send, loading, request, result } = useRequest();

  function tryCode(row) {
    setPicked(row);
    const path = row.path ?? `/api/basics/status/${row.code}`;
    // For a success, client.js only returns the body – the status we record is the one we asked for.
    send('GET', path, (signal) => api.get(path, { signal }), Number(row.code) || 200);
  }

  const tone = (code) => (code === 'bug' || code >= 500 ? 'danger' : code >= 400 ? 'warning' : 'success');

  return (
    <div className="stack">
      <div className="row" role="group" aria-label="Status codes to try">
        {CODES.map((row) => (
          <button
            key={row.code}
            type="button"
            className="btn btn-sm fastapi-code-btn"
            data-tone={tone(row.code)}
            aria-pressed={picked?.code === row.code}
            onClick={() => tryCode(row)}
          >
            {row.code === 'bug' ? <><Bug size={14} aria-hidden="true" /> crash</> : row.code}
          </button>
        ))}
      </div>

      <div className="fastapi-compare" aria-live="polite">
        <div className="fastapi-panel stack-sm">
          <strong className="small">1 · The HTTP response</strong>
          {!request && <p className="muted small m-0">Press a code above.</p>}
          {request && <code className="small">GET {request.path}</code>}
          {loading && <span className="spinner" role="status" aria-label="Waiting" />}
          {result && <p className="m-0"><StatusBadge status={result.status} /> <span className="muted small">{result.ms} ms</span></p>}
          {picked && result && !result.error?.isOffline && <p className="small m-0">{picked.when}</p>}
          {result && !result.error && (
            <p className="small subtle m-0">
              For a success, client.js returns only the body – so the code above is the one this endpoint is
              declared to send, not one read from the response. The playground below shows the real status.
            </p>
          )}
        </div>
        <div className="fastapi-panel stack-sm">
          <strong className="small">2 · What client.js gave your React code</strong>
          {!result && <p className="muted small m-0">A resolved promise – or a thrown ApiError.</p>}
          {result?.error?.isOffline && <OfflineNote error={result.error} />}
          {result && !result.error && (
            <>
              <p className="row small m-0"><CircleCheck size={16} className="fastapi-ok" aria-hidden="true" /> The promise <strong>resolved</strong> with:</p>
              <pre className="demo-output">{result.data == null ? 'null   // 204: there is no body' : JSON.stringify(result.data, null, 2)}</pre>
            </>
          )}
          {result?.error && !result.error.isOffline && (
            <>
              <p className="row small m-0"><CircleX size={16} className="fastapi-bad" aria-hidden="true" /> It <strong>threw</strong> an ApiError – handle it in <code>catch (error)</code>:</p>
              <pre className="demo-output">{describeError(result.error)}</pre>
            </>
          )}
        </div>
      </div>

      <div className="table-wrap">
        <table className="table fastapi-status-table">
          <caption>Reference: which code when?</caption>
          <thead>
            <tr><th>Code</th><th>Meaning / when</th><th>In FastAPI</th><th>What the UI should do</th></tr>
          </thead>
          <tbody>
            {CODES.map((row) => (
              <tr key={row.code} className={picked?.code === row.code ? 'is-picked' : undefined}>
                <th scope="row">
                  <span className="mono">{row.code === 'bug' ? 500 : row.code}</span>{' '}
                  <span className="small muted">{row.code === 'bug' ? '(a bug)' : STATUS_TEXT[row.code]}</span>
                </th>
                <td>{row.when}</td>
                <td><code>{row.fastapi}</code></td>
                <td>{row.ui}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
