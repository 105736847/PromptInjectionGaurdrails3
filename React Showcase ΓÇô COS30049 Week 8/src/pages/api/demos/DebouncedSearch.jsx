/**
 * DebouncedSearch – search while typing, without sending a request for
 * every single key press.
 *
 * "Debouncing" = wait until the user has STOPPED typing for 400 ms, then
 * search once. The custom hook below restarts a timer on every change; the
 * effect cleanup clears the old timer. Older requests are also aborted, so a
 * slow answer for "da" can never overwrite the answer for "data".
 */
import { useEffect, useState } from 'react';
import { CircleAlert, Search } from 'lucide-react';
import { searchStudents } from './fakeApi.js';
import NetworkToggles from './NetworkToggles.jsx';

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // typed again before `delay`? cancel and start over
  }, [value, delay]);
  return debounced;
}

/** Wrap the matching part of the text in <mark>. */
function Highlight({ text, query }) {
  const start = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || start === -1) return text;
  return (
    <>
      {text.slice(0, start)}
      <mark>{text.slice(start, start + query.length)}</mark>
      {text.slice(start + query.length)}
    </>
  );
}

export default function DebouncedSearch() {
  const [network, setNetwork] = useState({ slow: false, fail: false });
  const [query, setQuery] = useState('');
  const [debounceOn, setDebounceOn] = useState(true);
  const [keyPresses, setKeyPresses] = useState(0);
  const [requests, setRequests] = useState(0);
  // Remember WHICH query a result belongs to – then "loading" can be derived.
  const [result, setResult] = useState({ query: '', items: [], error: null });

  const debouncedQuery = useDebouncedValue(query, debounceOn ? 400 : 0);
  const term = debouncedQuery.trim();

  useEffect(() => {
    if (!term) return undefined;
    const controller = new AbortController();
    setRequests((n) => n + 1); // just for the counter below
    searchStudents(term, { ...network, signal: controller.signal })
      .then((items) => setResult({ query: term, items, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError') setResult({ query: term, items: [], error: err.message });
      });
    return () => controller.abort(); // a newer search makes this one pointless
  }, [term, network]);

  const isTyping = query !== debouncedQuery;
  const isSearching = term !== '' && result.query !== term;
  const hasResult = term !== '' && result.query !== ''; // old results stay (dimmed) while searching
  let statusText = '';
  if (isTyping) statusText = 'Waiting for you to stop typing…';
  else if (isSearching) statusText = 'Searching…';
  else if (hasResult && !result.error) statusText = `${result.items.length} result(s)`;

  return (
    <div className="stack">
      <div className="row">
        <NetworkToggles value={network} onChange={setNetwork} />
        <label className="switch small">
          <input type="checkbox" checked={debounceOn} onChange={(e) => setDebounceOn(e.target.checked)} />
          <span className="switch-track" />
          Debounce (400 ms)
        </label>
      </div>

      <div className="api-search">
        <Search size={16} aria-hidden="true" />
        <input
          className="input"
          type="search"
          aria-label="Search students by name or major"
          placeholder="Try “data” or “li”…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setKeyPresses((n) => n + 1);
          }}
        />
      </div>

      <div className="row-between small">
        <span className="muted" aria-live="polite">
          {statusText}
        </span>
        <span className="badge badge-code">
          {keyPresses} key presses → {requests} requests
        </span>
      </div>

      {hasResult && result.error && !isSearching && (
        <div className="alert alert-danger" role="alert">
          <CircleAlert size={20} />
          <span>Search failed: {result.error}</span>
        </div>
      )}

      {hasResult && !result.error && (
        <ul className={`api-results ${isSearching || isTyping ? 'api-stale' : ''}`}>
          {result.items.map((s) => (
            <li key={s.id}>
              <Highlight text={`${s.firstName} ${s.lastName}`} query={result.query} />
              <span className="small muted">
                <Highlight text={s.major} query={result.query} />
              </span>
            </li>
          ))}
          {result.items.length === 0 && <li className="muted">No students match “{result.query}”.</li>}
        </ul>
      )}
    </div>
  );
}
