/**
 * HelloEndpoint – call your first FastAPI endpoint from React.
 *
 * Python side (basics.py):   @router.get("/hello")  def hello(name: str = "World")
 * React side (this file):    api.get(`/api/basics/hello?name=${…}`)
 *
 * The request is sent from an event handler (a form submit), so no useEffect is
 * needed. encodeURIComponent() makes names like "Zoë & Li" safe inside a URL.
 */
import { useState } from 'react';
import { Send } from 'lucide-react';

import { api, API_BASE } from '../../../api/client.js';
import useRequest from './useRequest.js';
import ResponseView from './ResponseView.jsx';

export default function HelloEndpoint() {
  const [name, setName] = useState('Mia');
  const { send, loading, request, result } = useRequest();

  // Derived from state during render – no extra state needed for the URL.
  const trimmed = name.trim();
  const path = trimmed ? `/api/basics/hello?name=${encodeURIComponent(trimmed)}` : '/api/basics/hello';
  const fullUrl = new URL(`${API_BASE}${path}`, window.location.origin).href;

  function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    send('GET', path, (signal) => api.get(path, { signal }));
  }

  return (
    <div className="stack">
      <form className="row" onSubmit={handleSubmit}>
        <label htmlFor="hello-name" className="label">
          Your name
        </label>
        <input
          id="hello-name"
          className="input fastapi-input-md"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Empty = use the default"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          <Send size={16} aria-hidden="true" /> {loading ? 'Sending…' : 'Send request'}
        </button>
      </form>

      <dl className="fastapi-facts">
        <dt>React calls</dt>
        <dd><code>api.get(&apos;{path}&apos;)</code></dd>
        <dt>Browser requests</dt>
        <dd><code>GET {fullUrl}</code></dd>
        <dt>Same thing in a terminal</dt>
        <dd><code>curl &apos;http://127.0.0.1:8000{path}&apos;</code></dd>
      </dl>

      <ResponseView request={request} result={result} loading={loading} />
      {result && !result.error && (
        <p className="small muted m-0">
          <code>server_time</code> is a Python <code>datetime</code>. FastAPI turned it into an ISO 8601 string, because
          JSON has no date type – in React use <code>new Date(data.server_time)</code> to get a Date back:{' '}
          <strong>{new Date(result.data.server_time).toLocaleTimeString()}</strong> on your clock.
        </p>
      )}
    </div>
  );
}
