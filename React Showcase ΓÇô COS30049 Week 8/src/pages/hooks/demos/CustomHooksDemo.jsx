/**
 * CustomHooksDemo – three home-made hooks working together.
 *
 * A custom hook is a function whose name starts with "use" and which calls
 * other hooks. It lets several components share STATEFUL LOGIC (not the
 * state itself – every component that calls the hook gets its own copy).
 *
 *   useDebounce(value, ms)  → search only after the user stops typing
 *   useOnlineStatus()       → react to the browser going offline
 *   useToggle()             → show / hide the email column
 */
import { useId, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { students } from '../../../data/students.js';
import useDebounce from './useDebounce.js';
import useOnlineStatus from './useOnlineStatus.js';
import useToggle from './useToggle.js';

export default function CustomHooksDemo() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const isOnline = useOnlineStatus();
  const [showEmail, toggleEmail] = useToggle(false);
  const id = useId();

  const isWaiting = query !== debouncedQuery; // derived: the user is still typing
  const term = debouncedQuery.trim().toLowerCase();
  const results = term
    ? students.filter((s) => `${s.firstName} ${s.lastName} ${s.major}`.toLowerCase().includes(term)).slice(0, 6)
    : [];

  return (
    <div className="stack">
      <div className="row-between">
        <span className={`badge ${isOnline ? 'badge-success' : 'badge-danger'}`} role="status">
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />} {isOnline ? 'Online' : 'Offline – results may be stale'}
        </span>
        <label className="switch">
          <input type="checkbox" checked={showEmail} onChange={toggleEmail} />
          <span className="switch-track" /> Show email
        </label>
      </div>

      <div className="field">
        <label className="label" htmlFor={id}>Search students (name or major)</label>
        <input id={id} className="input" type="search" placeholder="Try “data” or “nguyen”…" value={query}
          onChange={(e) => setQuery(e.target.value)} />
        <p className="hint" aria-live="polite">
          {isWaiting ? '⌛ Waiting for you to stop typing…' : term ? `Searched for “${debouncedQuery}”` : 'Type to search.'}
        </p>
      </div>

      <div className="grid-2 small">
        <div className="demo-output">query: "{query}"</div>
        <div className="demo-output">debouncedQuery: "{debouncedQuery}"</div>
      </div>

      {term && (
        <ul className="hooks-results">
          {results.length === 0 && <li className="muted">No matches.</li>}
          {results.map((s) => (
            <li key={s.id}>
              <strong>{s.firstName} {s.lastName}</strong>
              <span className="muted">{s.major}</span>
              {showEmail && <span className="mono subtle">{s.email}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
