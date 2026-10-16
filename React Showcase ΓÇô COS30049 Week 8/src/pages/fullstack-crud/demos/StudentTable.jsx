/**
 * StudentTable – a SERVER-SIDE table: search, filters, sorting and paging all
 * happen in the database. The browser only ever receives one page of rows.
 *
 * Where does the state live? In the URL (useSearchParams), not in useState:
 *  - copy the address bar → a classmate sees exactly the same view
 *  - refresh the page → nothing is lost
 * Every change of the URL → new `query` → useStudents() sends a new request.
 */
import { useEffect, useEffectEvent, useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Link, RotateCcw, Search } from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import useStudents from './useStudents.js';
import { useHighlightedId } from './StudentsData.jsx';
import { CAMPUSES, MAJORS, STATUSES } from './studentsApi.js';
import { GradeBadge, RequestError, StatusBadge } from './StudentBits.jsx';
import Pagination, { PAGE_SIZES } from './Pagination.jsx';
import RequestPanel from './RequestPanel.jsx';

const DEFAULTS = { q: '', major: '', campus: '', status: '', year: '', sort: 'last_name', order: 'asc', page: 1, page_size: 10 };
// `key` must be one of the sort columns the server allows (SortField in backend/app/models/student.py).
// "Name" sorts by last name, then first name – the server uses them as tie-breakers.
const COLUMNS = [
  { key: 'student_id', label: 'Student ID' },
  { key: 'last_name', label: 'Name' },
  { key: 'major', label: 'Major' },
  { key: 'campus', label: 'Campus' },
  { key: 'year', label: 'Year', num: true },
  { key: 'score', label: 'Score', num: true },
  { key: 'grade', label: 'Grade', sortable: false }, // computed from score – sort by score instead
  { key: 'status', label: 'Status' },
];
const SORTABLE = COLUMNS.filter((c) => c.sortable !== false).map((c) => c.key);

/** URL → a complete query object. Anything missing or broken falls back to a default. */
function readQuery(searchParams) {
  const get = (key) => searchParams.get(key) ?? String(DEFAULTS[key]);
  const page = Number.parseInt(get('page'), 10);
  const pageSize = Number(get('page_size'));
  return {
    q: get('q'), major: get('major'), campus: get('campus'), status: get('status'), year: get('year'),
    sort: SORTABLE.includes(get('sort')) ? get('sort') : DEFAULTS.sort,
    order: get('order') === 'desc' ? 'desc' : 'asc',
    page: page >= 1 ? page : 1,
    page_size: PAGE_SIZES.includes(pageSize) ? pageSize : DEFAULTS.page_size,
  };
}

/** Wait until `value` stops changing for `delay` ms (so we don't send one request per key press). */
function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // typed again → cancel the previous timer
  }, [value, delay]);
  return debounced;
}

export default function StudentTable() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = readQuery(searchParams); // derived during render – no extra state
  const { data, error, loading, refetch, url } = useStudents(query);
  const highlightId = useHighlightedId();
  const { showToast } = useToast();
  const ids = useId();

  function updateQuery(changes) {
    // Any filter change starts again at page 1 (page 4 of the new result may not exist).
    const next = { ...query, page: 1, ...changes };
    // Only non-default values go into the URL → short, readable links.
    const params = Object.entries(next).filter(([key, value]) => value !== '' && String(value) !== String(DEFAULTS[key]));
    setSearchParams(Object.fromEntries(params), { replace: true }); // replace: don't flood the Back button
  }

  // The search box has its own state (instant typing); the URL only gets the settled text.
  const [text, setText] = useState(query.q);
  const debouncedText = useDebouncedValue(text.trim(), 350);
  // useEffectEvent reads the LATEST query without making it a dependency, so
  // this effect runs only when the typed text settles – not on every render.
  const onSearchSettled = useEffectEvent((q) => {
    if (q !== query.q) updateQuery({ q });
  });
  useEffect(() => {
    onSearchSettled(debouncedText);
  }, [debouncedText]);

  function toggleSort(key) {
    // Same column → flip the direction; new column → start ascending.
    updateQuery({ sort: key, order: query.sort === key && query.order === 'asc' ? 'desc' : 'asc' });
  }

  function resetView() {
    setText('');
    setSearchParams({}, { replace: true });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast({ type: 'success', title: 'Link copied', message: 'Open it in a new tab – the table restores this exact view.' });
    } catch {
      showToast({ type: 'warning', title: 'Copy blocked by the browser', message: window.location.href });
    }
  }

  const filters = [
    { key: 'major', label: 'Major', options: MAJORS.map((m) => ({ value: m, label: m })) },
    { key: 'campus', label: 'Campus', options: CAMPUSES.map((c) => ({ value: c, label: c })) },
    { key: 'status', label: 'Status', options: STATUSES },
    { key: 'year', label: 'Year', options: [1, 2, 3, 4].map((y) => ({ value: String(y), label: `Year ${y}` })) },
  ];

  return (
    <div className="stack">
      <div className="crud-filters">
        <div className="field crud-search">
          <label className="label" htmlFor={`${ids}-q`}>Search</label>
          <div className="crud-input-icon">
            <Search size={16} aria-hidden="true" />
            <input id={`${ids}-q`} className="input" type="search" value={text} placeholder="Name, email or student ID"
              onChange={(e) => setText(e.target.value)} />
          </div>
        </div>
        {filters.map((f) => (
          <div className="field" key={f.key}>
            <label className="label" htmlFor={`${ids}-${f.key}`}>{f.label}</label>
            <select id={`${ids}-${f.key}`} className="input" value={query[f.key]} onChange={(e) => updateQuery({ [f.key]: e.target.value })}>
              <option value="">All</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="row-between">
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={resetView}><RotateCcw size={14} /> Reset view</button>
          <button type="button" className="btn btn-sm" onClick={copyLink}><Link size={14} /> Copy link to this view</button>
        </div>
        {loading && <span className="row small muted" role="status"><span className="spinner crud-spinner-sm" /> Loading…</span>}
      </div>

      <RequestError error={error} onRetry={refetch} />

      {/* aria-busy + a CSS class dim the OLD rows while the new page loads (no empty flash). */}
      <div className={`table-wrap crud-table-wrap ${loading && data ? 'crud-is-loading' : ''}`} aria-busy={loading}>
        <table className="table crud-table">
          <caption className="visually-hidden">Students – click a column header to sort</caption>
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                if (col.sortable === false) return <th key={col.key}>{col.label}</th>;
                const active = query.sort === col.key;
                const Icon = !active ? ArrowUpDown : query.order === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th key={col.key} className={col.num ? 'num' : undefined}
                    aria-sort={active ? (query.order === 'asc' ? 'ascending' : 'descending') : undefined}>
                    <button type="button" className={`crud-sort ${active ? 'is-active' : ''}`} onClick={() => toggleSort(col.key)}>
                      {col.label} <Icon size={13} aria-hidden="true" />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data?.items.map((s) => (
              <tr key={s.id} className={s.id === highlightId ? 'crud-row-flash' : undefined}>
                <td className="mono small">{s.student_id}</td>
                <td>
                  <strong>{s.last_name}</strong>, {s.first_name}
                  <span className="crud-sub">{s.email}</span>
                </td>
                <td className="crud-wrap-cell">{s.major}</td>
                <td>{s.campus}</td>
                <td className="num">{s.year}</td>
                <td className="num">{s.score}</td>
                <td><GradeBadge grade={s.grade} /></td>
                <td><StatusBadge status={s.status} /></td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr><td colSpan={COLUMNS.length} className="center muted crud-empty">
                {data.total > 0 ? `Page ${query.page} is empty. ` : 'No students match these filters. '}
                <button type="button" className="btn btn-sm" onClick={resetView}>Reset view</button>
              </td></tr>
            )}
            {!data && (
              <tr><td colSpan={COLUMNS.length} className="center muted crud-empty">{loading ? 'Loading students…' : 'No data yet.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={query.page} pages={data?.pages ?? 1} pageSize={query.page_size} total={data?.total ?? 0}
        disabled={!data} onPage={(page) => updateQuery({ page })} onPageSize={(size) => updateQuery({ page_size: size })} />

      <RequestPanel url={url} query={query} data={data} error={error} loading={loading} />
    </div>
  );
}
