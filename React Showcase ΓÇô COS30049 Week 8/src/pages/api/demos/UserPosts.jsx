/**
 * UserPosts – dependent requests and race conditions.
 *
 * Request 1 loads the users. Request 2 depends on the user you pick.
 * If you switch users quickly, the responses can arrive in the WRONG order:
 * the answer for user 2 might land after the answer for user 5. The `ignore`
 * flag set in the cleanup function makes sure only the latest answer is used.
 * Turn it off and switch users quickly to watch the bug happen.
 */
import { useEffect, useState } from 'react';
import useFetch from '../../../hooks/useFetch.js';

const API_URL = 'https://jsonplaceholder.typicode.com';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Returns an updater for setLog: newest line first, keep the last 6.
const addLine = (line) => (current) => [line, ...current].slice(0, 6);

export default function UserPosts() {
  const { data: users, loading: usersLoading } = useFetch(`${API_URL}/users`); // request 1
  const [userId, setUserId] = useState('');
  const [posts, setPosts] = useState(null);
  const [shownUserId, setShownUserId] = useState(null); // whose posts are on screen
  const [loading, setLoading] = useState(false);
  const [ignoreStale, setIgnoreStale] = useState(true);
  const [log, setLog] = useState([]);

  // Request 2 – runs whenever the selected user changes.
  useEffect(() => {
    if (!userId) return undefined;
    let ignore = false; // becomes true when a newer request replaces this one

    async function loadPosts() {
      await sleep(Math.random() * 1500); // random delay to make the race visible
      const response = await fetch(`${API_URL}/posts?userId=${userId}&_limit=4`);
      if (!response.ok) throw new Error(`status ${response.status}`);
      const data = await response.json();
      if (ignore && ignoreStale) {
        setLog(addLine(`✗ user ${userId}: arrived too late → ignored`));
        return;
      }
      setLog(addLine(`✓ user ${userId}: ${data.length} posts shown`));
      setPosts(data);
      setShownUserId(userId);
      setLoading(false);
    }

    loadPosts().catch((err) => {
      if (!ignore) {
        setLog(addLine(`✗ user ${userId}: ${err.message}`));
        setLoading(false);
      }
    });
    return () => {
      ignore = true; // cleanup runs before the next effect → this response is now stale
    };
  }, [userId, ignoreStale]);

  function handleUserChange(event) {
    setUserId(event.target.value);
    setLoading(true);
    setLog(addLine(`→ requested posts for user ${event.target.value}`));
  }

  const mismatch = shownUserId !== null && shownUserId !== userId && !loading;
  const selectedUser = users?.find((u) => String(u.id) === userId);

  return (
    <div className="stack">
      <div className="row">
        <select
          className="input api-inline-select"
          aria-label="Choose a user"
          value={userId}
          onChange={handleUserChange}
          disabled={usersLoading}
        >
          <option value="" disabled>
            {usersLoading ? 'Loading users…' : 'Choose a user…'}
          </option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <label className="switch small">
          <input type="checkbox" checked={ignoreStale} onChange={(e) => setIgnoreStale(e.target.checked)} />
          <span className="switch-track" />
          Ignore stale responses
        </label>
      </div>

      <div className="api-split">
        <div className={`stack-sm ${loading ? 'api-stale' : ''}`} aria-busy={loading}>
          {selectedUser && (
            <p className="m-0 small">
              Selected: <strong>{selectedUser.name}</strong>
              {loading && ' – loading…'}
            </p>
          )}
          {mismatch && (
            <p className="m-0 small api-warning-text">
              ⚠ The list below belongs to user {shownUserId}, not the selected user {userId}!
            </p>
          )}
          {posts?.map((post) => (
            <div key={post.id} className="api-post">
              <strong>{post.title}</strong>
            </div>
          ))}
          {!userId && <p className="m-0 small muted">Pick a user to load their posts.</p>}
        </div>
        <pre className="demo-output api-log" role="log" aria-label="Request log">
          {log.length ? log.join('\n') : 'Request log…'}
        </pre>
      </div>
    </div>
  );
}
