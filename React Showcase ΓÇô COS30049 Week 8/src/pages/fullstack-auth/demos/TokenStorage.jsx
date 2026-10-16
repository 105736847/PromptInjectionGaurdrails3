/**
 * TokenStorage – where should a React app keep its token?
 *
 * The AuthProvider keeps it in React state (memory) by default. The switch also
 * copies it into sessionStorage, so a page reload keeps you logged in.
 * The "XSS" button runs what an injected script could run – and shows what it finds.
 */
import { useState } from 'react';
import { Bug, HardDrive, MemoryStick, RotateCcw } from 'lucide-react';

import { STORAGE_KEY, useAuth } from '../AuthContext.jsx';
import SessionBar from '../SessionBar.jsx';
import { shortToken } from '../authUtils.js';

const OPTIONS = [
  {
    where: 'React state (memory)',
    reload: 'No – log in again',
    xss: 'Not in storage (but a script can still act while the page is open)',
    sentAutomatically: 'No',
  },
  {
    where: 'sessionStorage',
    reload: 'Yes (this tab only)',
    xss: 'Yes – one line of JS reads it',
    sentAutomatically: 'No',
  },
  {
    where: 'localStorage',
    reload: 'Yes – every tab, until removed',
    xss: 'Yes – and it stays there longest',
    sentAutomatically: 'No',
  },
  {
    where: 'httpOnly cookie (set by the server)',
    reload: 'Yes',
    xss: 'No – JavaScript cannot read httpOnly cookies',
    sentAutomatically: 'Yes → protect against CSRF (SameSite, CSRF token)',
  },
];

export default function TokenStorage() {
  const { token, persist, setPersist } = useAuth();
  const [stolen, setStolen] = useState(null);

  // Exactly what a malicious script injected into the page (XSS) could do:
  function runXssScript() {
    let loot = null;
    try {
      loot = JSON.parse(sessionStorage.getItem(STORAGE_KEY))?.token ?? null;
    } catch {
      loot = null; // storage blocked or not JSON
    }
    setStolen({ loot, at: new Date().toLocaleTimeString() });
  }

  return (
    <div className="stack">
      <SessionBar />

      <label className="switch">
        <input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)} />
        <span className="switch-track" />
        <span>
          Keep me logged in for this tab (also store the token in <code>sessionStorage</code>)
        </span>
      </label>

      <div className="grid-2">
        <div className={`card card-subtle auth-store${token ? ' is-filled' : ''}`}>
          <MemoryStick size={18} aria-hidden="true" />
          <div>
            <strong>React state</strong>
            <p className="m-0 small muted">{token ? shortToken(token) : 'empty'}</p>
          </div>
        </div>
        <div className={`card card-subtle auth-store${token && persist ? ' is-filled' : ''}`}>
          <HardDrive size={18} aria-hidden="true" />
          <div>
            <strong>sessionStorage</strong>
            <p className="m-0 small muted">{token && persist ? `"${STORAGE_KEY}" → ${shortToken(token)}` : 'empty'}</p>
          </div>
        </div>
      </div>

      <div className="stack-sm">
        <div className="row">
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            <RotateCcw size={16} aria-hidden="true" /> Reload the page
          </button>
          <button type="button" className="btn btn-danger" onClick={runXssScript}>
            <Bug size={16} aria-hidden="true" /> Run an “XSS” script
          </button>
        </div>

        {/* Always rendered: screen readers announce changes INSIDE an existing live region */}
        <div aria-live="polite">
          {stolen && (
            <pre className="demo-output">
              {`// injected script, ${stolen.at}
sessionStorage.getItem('${STORAGE_KEY}')
→ ${stolen.loot ? `STOLEN: ${shortToken(stolen.loot, 24)}  (sent to the attacker's server…)` : 'null – nothing to steal in storage'}`}
            </pre>
          )}
        </div>
      </div>

      <div className="table-wrap">
        <table className="table small auth-table">
          <caption>Four places for a token – there is no perfect one</caption>
          <thead>
            <tr>
              <th scope="col">Where</th>
              <th scope="col">Survives reload?</th>
              <th scope="col">Readable by injected JS?</th>
              <th scope="col">Sent automatically?</th>
            </tr>
          </thead>
          <tbody>
            {OPTIONS.map((option) => (
              <tr key={option.where}>
                <th scope="row">{option.where}</th>
                {/* data-label: the column name, shown on phones where the table becomes cards */}
                <td data-label="Survives reload?">{option.reload}</td>
                <td data-label="Readable by injected JS?">{option.xss}</td>
                <td data-label="Sent automatically?">{option.sentAutomatically}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
