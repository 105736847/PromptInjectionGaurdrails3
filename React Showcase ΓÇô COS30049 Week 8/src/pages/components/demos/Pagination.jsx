/**
 * Pagination – split a long list into pages.
 *
 * - Only TWO pieces of state: `page` and `pageSize`. Everything else
 *   (number of pages, the visible slice, "Showing 21–30 of 195") is calculated
 *   during render – no useEffect needed.
 * - getPageItems() is a plain function (easy to move to utils.js and unit-test) that returns
 *   something like [1, '…', 4, 5, 6, '…', 20].
 */
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

const TOPICS = ['FastAPI CORS error', 'Group meeting times', 'Lab 7 useEffect question', 'Assignment 3 rubric', 'Model accuracy help', 'Exam revision tips'];
const POSTS = Array.from({ length: 195 }, (_, i) => ({ id: i + 1, title: `${TOPICS[i % TOPICS.length]} (#${i + 1})` }));

function getPageItems(current, total, siblings = 1) {
  // Always show the first page, the last page and the current page ± siblings.
  const pages = new Set([1, total]);
  for (let p = current - siblings; p <= current + siblings; p++) {
    if (p > 1 && p < total) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);

  const items = [];
  sorted.forEach((page, i) => {
    const previous = sorted[i - 1];
    if (previous && page - previous === 2) items.push(previous + 1); // a gap of one page: just show it
    else if (previous && page - previous > 2) items.push(`gap-${page}`); // a bigger gap: "…"
    items.push(page);
  });
  return items;
}

export default function Pagination() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Derived values – recalculated on every render.
  const total = POSTS.length;
  const pageCount = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const visible = POSTS.slice(start, start + pageSize);
  const end = start + visible.length;

  function changePageSize(event) {
    setPageSize(Number(event.target.value));
    setPage(1); // the old page number may not exist any more
  }

  return (
    <div className="stack">
      <ol className={styles.list} start={start + 1}>
        {visible.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ol>

      <div className="row-between">
        <p className="small muted m-0" aria-live="polite">
          Showing <strong>{start + 1}–{end}</strong> of {total} posts
        </p>
        <label className="row small">
          Per page
          <select className="input" style={{ width: 'auto', height: 32 }} value={pageSize} onChange={changePageSize}>
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>

      <nav aria-label="Forum pages">
        <ul className={styles.pager}>
          <li>
            <button type="button" className={styles.pageButton} onClick={() => setPage(page - 1)} disabled={page === 1} aria-label="Previous page">
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
          </li>
          {getPageItems(page, pageCount).map((item) =>
            typeof item === 'number' ? (
              <li key={item}>
                <button
                  type="button"
                  className={styles.pageButton}
                  aria-current={item === page ? 'page' : undefined}
                  aria-label={`Page ${item}`}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              </li>
            ) : (
              <li key={item} className={styles.gap} aria-hidden="true">…</li>
            ),
          )}
          <li>
            <button type="button" className={styles.pageButton} onClick={() => setPage(page + 1)} disabled={page === pageCount} aria-label="Next page">
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
