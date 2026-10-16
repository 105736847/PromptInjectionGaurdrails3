/**
 * PostsWithEffect – load data when a component first appears, written by hand.
 *
 * Every request has three states: loading → success OR error.
 * - useEffect starts the request AFTER React has put the component on screen.
 * - The cleanup function aborts the request if the component disappears (or
 *   the effect re-runs) before the answer arrives.
 */
import { useEffect, useState } from 'react';
import { CircleAlert, RotateCw } from 'lucide-react';

const API_URL = 'https://jsonplaceholder.typicode.com';

function PostSkeleton() {
  return (
    <li className="api-post" aria-hidden="true">
      <span className="api-skeleton" style={{ width: '60%' }} />
      <span className="api-skeleton" />
      <span className="api-skeleton" style={{ width: '85%' }} />
    </li>
  );
}

export default function PostsWithEffect() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0); // changing it re-runs the effect
  const [brokenUrl, setBrokenUrl] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPosts() {
      try {
        const path = brokenUrl ? '/postz' : '/posts'; // "/postz" does not exist → 404
        const response = await fetch(`${API_URL}${path}?_limit=10`, { signal: controller.signal });
        // fetch() only rejects when the NETWORK fails. A 404 or 500 still "succeeds",
        // so always check response.ok yourself.
        if (!response.ok) throw new Error(`The server answered ${response.status}.`);
        const data = await response.json();
        setPosts(data);
        setStatus('success');
      } catch (err) {
        if (err.name === 'AbortError') return; // we cancelled it ourselves – not a real error
        setError(err.message);
        setStatus('error');
      }
    }

    loadPosts();
    return () => controller.abort(); // cleanup
  }, [attempt, brokenUrl]); // re-run when Retry is clicked or the URL changes

  // Switch to "loading" inside the event handler – not at the top of the effect.
  function retry() {
    setStatus('loading');
    setAttempt((n) => n + 1);
  }

  function toggleBrokenUrl(event) {
    setStatus('loading');
    setBrokenUrl(event.target.checked);
  }

  return (
    <div className="stack">
      <label className="switch small">
        <input type="checkbox" checked={brokenUrl} onChange={toggleBrokenUrl} />
        <span className="switch-track" />
        Use a broken URL (to see the error state)
      </label>

      {status === 'loading' && (
        <div role="status">
          <span className="visually-hidden">Loading posts…</span>
          <ol className="api-post-list">
            {[1, 2, 3].map((n) => (
              <PostSkeleton key={n} />
            ))}
          </ol>
        </div>
      )}

      {status === 'error' && (
        <div className="alert alert-danger" role="alert">
          <CircleAlert size={20} />
          <div className="stack-sm">
            <strong>Could not load the posts.</strong>
            <span className="small">{error}</span>
            <div>
              <button type="button" className="btn btn-sm" onClick={retry}>
                <RotateCw size={14} /> Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'success' && (
        <ol className="api-post-list">
          {posts.map((post) => (
            <li key={post.id} className="api-post">
              <strong>{post.title}</strong>
              <p className="m-0 small muted">{post.body}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
