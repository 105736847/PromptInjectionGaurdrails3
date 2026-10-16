/**
 * PaginationDemo – ONE dependency, TWO endpoints.
 *
 * On the server, pagination(q, skip, limit) is written once and both
 * list_units() and list_events() ask for it with `page: PaginationDep`.
 * So both endpoints understand exactly the same query parameters – and this
 * component can drive them with the same controls.
 */
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { api } from '../../../api/client.js';
import useRequest from './useRequest.js';
import { OfflineNote } from './ResponseView.jsx';

const ENDPOINTS = [
  { path: '/api/basics/units', title: 'Units', show: (item) => `${item.code} · ${item.title}` },
  { path: '/api/basics/events', title: 'Campus events', show: (item) => `Week ${item.week} · ${item.title}` },
];

function queryString({ q, skip, limit }) {
  const params = new URLSearchParams({ skip, limit });
  if (q.trim()) params.set('q', q.trim());
  return `?${params}`;
}

/** "Showing 5–8 of 12" – or why this page is empty. The two lists have different totals. */
function rangeText({ total, skip, limit }) {
  if (total === 0) return 'No matches';
  if (skip >= total) return `No items on this page (${total} in total)`;
  return `Showing ${skip + 1}–${Math.min(skip + limit, total)} of ${total}`;
}

export default function PaginationDemo() {
  const [page, setPage] = useState({ q: '', skip: 0, limit: 4 });
  // keepPrevious: the old lists stay (dimmed) while the next page loads – no flicker while typing.
  const { send, loading, result } = useRequest({ keepPrevious: true });
  const query = queryString(page);

  // The data depends on `query` → (re)load whenever it changes. useRequest cancels
  // the previous request, so fast typing never shows an out-of-date page.
  useEffect(() => {
    send('GET', query, (signal) => Promise.all(ENDPOINTS.map((e) => api.get(`${e.path}${query}`, { signal }))));
  }, [send, query]);

  // Typing a new search goes back to the first page.
  const change = (patch) => setPage((previous) => ({ ...previous, skip: 0, ...patch }));
  const pages = result?.data ?? [];
  const largestTotal = Math.max(0, ...pages.map((p) => p.total));

  return (
    <div className="stack">
      <div className="row fastapi-controls">
        <label className="field fastapi-grow">
          <span className="label">q (search)</span>
          <input className="input" value={page.q} onChange={(e) => change({ q: e.target.value })} placeholder="e.g. data, workshop" />
        </label>
        <label className="field">
          <span className="label">limit</span>
          <select className="input" value={page.limit} onChange={(e) => change({ limit: Number(e.target.value) })}>
            {[2, 4, 6, 25].map((n) => <option key={n} value={n}>{n}{n > 20 ? ' (too big → 422)' : ''}</option>)}
          </select>
        </label>
        <div className="field">
          <span className="label">skip = {page.skip}</span>
          <div className="row">
            <button type="button" className="btn" aria-label="Previous page" disabled={page.skip === 0} onClick={() => setPage({ ...page, skip: Math.max(0, page.skip - page.limit) })}>
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button type="button" className="btn" aria-label="Next page" disabled={page.skip + page.limit >= largestTotal} onClick={() => setPage({ ...page, skip: page.skip + page.limit })}>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {result?.error?.isOffline && <OfflineNote error={result.error} />}
      {result?.error && !result.error.isOffline && <p className="alert alert-warning m-0">{result.error.status}: {result.error.message}</p>}

      <div className="fastapi-compare" aria-busy={loading}>
        {ENDPOINTS.map((endpoint, i) => {
          const data = pages[i];
          return (
            <section key={endpoint.path} className="fastapi-panel stack-sm">
              <code className="small">GET {endpoint.path}{query}</code>
              <strong>{endpoint.title}</strong>
              {/* Always rendered, so screen readers announce each new range. */}
              <p className="small muted m-0" aria-live="polite">{data ? rangeText(data) : ''}</p>
              {data && (
                <ul className="fastapi-list">
                  {data.items.map((item) => <li key={endpoint.show(item)}>{endpoint.show(item)}</li>)}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
