/**
 * ResponseModelDemo – the same user record, sent two ways.
 *
 *   GET /api/basics/profiles/1/unsafe  → `-> UserRecord`: the stored model is the response
 *                                         model, so EVERYTHING is sent
 *   GET /api/basics/profiles/1         → response_model=PublicProfile: only 4 fields
 *
 * Both endpoints call the same load_user() function, so the left column shows
 * exactly what the Python function returned, and the right column what actually
 * reached the browser once FastAPI filtered it.
 */
import { useEffect, useState } from 'react';
import { EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react';

import { api } from '../../../api/client.js';
import useRequest from './useRequest.js';
import { OfflineNote } from './ResponseView.jsx';

const USERS = [
  { id: 1, label: 'Mia (student)' },
  { id: 2, label: 'Dr Okafor (lecturer)' },
  { id: 3, label: 'Sam (tutor)' },
  { id: 99, label: 'id 99 (missing)' },
];

/** Fetch the unsafe and the safe version at the same time (Promise.all fails if either fails). */
const fetchBoth = (id) => (signal) =>
  Promise.all([
    api.get(`/api/basics/profiles/${id}/unsafe`, { signal }),
    api.get(`/api/basics/profiles/${id}`, { signal }),
  ]);

export default function ResponseModelDemo() {
  const [userId, setUserId] = useState(1);
  const { send, loading, result } = useRequest();

  function load(id) {
    setUserId(id);
    send('GET', `/api/basics/profiles/${id}`, fetchBoth(id));
  }

  // Show user 1 when the demo first appears. `send` never changes (useCallback), so this runs once.
  useEffect(() => {
    send('GET', '/api/basics/profiles/1', fetchBoth(1));
  }, [send]);

  const [returned, received] = result?.data ?? [];
  const dropped = returned ? Object.keys(returned).filter((key) => !(key in received)) : [];
  const summary = result?.error && !result.error.isOffline
    ? `${result.error.status}: ${result.error.message}`
    : returned ? `The function returned ${Object.keys(returned).length} fields; the client received ${Object.keys(received).length}.` : '';

  return (
    <div className="stack">
      <div className="btn-group" role="group" aria-label="Choose a user">
        {USERS.map((user) => (
          <button key={user.id} type="button" className={`btn btn-sm ${userId === user.id ? 'active' : ''}`} aria-pressed={userId === user.id} onClick={() => load(user.id)}>
            {user.label}
          </button>
        ))}
      </div>

      {loading && <span className="spinner" role="status" aria-label="Loading profiles" />}
      {result?.error?.isOffline && <OfflineNote error={result.error} />}
      {result?.error && !result.error.isOffline && (
        <p className="alert alert-warning m-0">{result.error.status}: {result.error.message}</p>
      )}
      {/* Always rendered (only its text changes), so screen readers announce every answer. */}
      <p className="visually-hidden" aria-live="polite">{summary}</p>

      {returned && (
        <div className="fastapi-compare">
          <section className="fastapi-panel fastapi-panel-danger stack-sm" aria-labelledby="rm-returned">
            <h4 id="rm-returned" className="row m-0"><ShieldAlert size={18} aria-hidden="true" /> What the function returned</h4>
            <p className="small muted m-0">
              Seen through <code>/profiles/{userId}/unsafe</code> – its return type is the full{' '}
              <code>UserRecord</code>, so nothing is filtered.
            </p>
            <KeyValues data={returned} flagged={dropped} />
          </section>
          <section className="fastapi-panel fastapi-panel-success stack-sm" aria-labelledby="rm-received">
            <h4 id="rm-received" className="row m-0"><ShieldCheck size={18} aria-hidden="true" /> What the client received</h4>
            <p className="small muted m-0">
              <code>/profiles/{userId}</code> with <code>response_model=PublicProfile</code>.
            </p>
            <KeyValues data={received} flagged={[]} />
            <p className="row small m-0">
              <EyeOff size={15} aria-hidden="true" /> Removed by FastAPI:{' '}
              {dropped.map((key) => <code key={key}>{key}</code>)}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function KeyValues({ data, flagged }) {
  return (
    <dl className="fastapi-kv">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className={flagged.includes(key) ? 'fastapi-kv-leak' : undefined}>
          <dt className="mono">{key}</dt>
          <dd className="mono">
            {JSON.stringify(value)}
            {flagged.includes(key) && <span className="badge badge-danger">leaked</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
