/**
 * InfiniteList – "Load more" pagination against the local fake API, with an
 * optional infinite-scroll mode.
 *
 * - Each click asks the server for the NEXT page and appends it to the list.
 * - Infinite scroll uses an IntersectionObserver: when an invisible "sentinel"
 *   element at the bottom of the list scrolls into view, we load the next page.
 * Use the switches to make the network slow or failing.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { getStudents } from './fakeApi.js';
import NetworkToggles from './NetworkToggles.jsx';

const PAGE_SIZE = 6;

export default function InfiniteList() {
  const [network, setNetwork] = useState({ slow: false, fail: false });
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0); // how many pages we have loaded
  const [total, setTotal] = useState(null); // unknown until the first answer
  const [status, setStatus] = useState('loading'); // 'idle' | 'loading' | 'error'
  const [error, setError] = useState(null);
  const [autoLoad, setAutoLoad] = useState(false);
  const scrollBoxRef = useRef(null);
  const sentinelRef = useRef(null);

  const hasMore = total === null || items.length < total;

  const loadMore = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const result = await getStudents({ page: page + 1, pageSize: PAGE_SIZE }, network);
      setItems((current) => [...current, ...result.items]); // append, don't replace
      setPage(result.page);
      setTotal(result.total);
      setStatus('idle');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [page, network]);

  // First page on mount. The AbortController makes StrictMode's double run harmless.
  useEffect(() => {
    const controller = new AbortController();
    getStudents({ page: 1, pageSize: PAGE_SIZE }, { signal: controller.signal })
      .then((result) => {
        setItems(result.items);
        setPage(1);
        setTotal(result.total);
        setStatus('idle');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setStatus('error');
      });
    return () => controller.abort();
  }, []);

  // Infinite scroll: watch the sentinel only while we are idle and there is more.
  useEffect(() => {
    if (!autoLoad || status !== 'idle' || !hasMore) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { root: scrollBoxRef.current, rootMargin: '40px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect(); // stop watching when anything changes
  }, [autoLoad, status, hasMore, loadMore]);

  return (
    <div className="stack">
      <div className="row">
        <NetworkToggles value={network} onChange={setNetwork} />
        <label className="switch small">
          <input type="checkbox" checked={autoLoad} onChange={(e) => setAutoLoad(e.target.checked)} />
          <span className="switch-track" />
          Load automatically on scroll
        </label>
      </div>

      <div className="api-scroll" ref={scrollBoxRef}>
        <ul className="api-people" aria-busy={status === 'loading'}>
          {items.map((s) => (
            <li key={s.id}>
              <span className="avatar" aria-hidden="true">
                {s.firstName[0]}
                {s.lastName[0]}
              </span>
              <span>
                <strong>
                  {s.firstName} {s.lastName}
                </strong>
                <span className="small muted"> · {s.major}</span>
              </span>
            </li>
          ))}
          {status === 'loading' &&
            [1, 2].map((n) => (
              <li key={`skeleton-${n}`} aria-hidden="true">
                <span className="avatar api-skeleton-circle" />
                <span className="api-skeleton" style={{ width: '50%' }} />
              </li>
            ))}
        </ul>
        {/* The invisible element the IntersectionObserver watches */}
        <div ref={sentinelRef} className="api-sentinel" />

        {status === 'error' && (
          <div className="alert alert-danger" role="alert">
            <CircleAlert size={20} />
            <span>
              {error}{' '}
              <button type="button" className="btn btn-sm" onClick={loadMore}>
                Try again
              </button>
            </span>
          </div>
        )}
        {status === 'idle' && hasMore && (
          <button type="button" className="btn btn-secondary api-load-more" onClick={loadMore}>
            Load more
          </button>
        )}
        {!hasMore && <p className="small muted center">That’s everyone – all {total} students loaded.</p>}
      </div>
      <p className="m-0 small muted" aria-live="polite">
        {items.length} of {total ?? '?'} students · {page} page{page === 1 ? '' : 's'} loaded
      </p>
    </div>
  );
}
