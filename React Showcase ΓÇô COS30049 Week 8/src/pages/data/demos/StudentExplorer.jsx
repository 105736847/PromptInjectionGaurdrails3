/**
 * StudentExplorer – a realistic data table: search, filters, sorting,
 * pagination, row selection with bulk actions, a card view and CSV export.
 *
 * The golden rule: keep only the MINIMUM in state (what the user chose) and
 * DERIVE everything else – filtered rows, sorted rows, the current page – while
 * rendering. useMemo only caches those calculations between renders.
 */
import { useMemo, useState } from 'react';
import { Download, LayoutGrid, Search, SearchX, Table2 } from 'lucide-react';
import { students, MAJORS, GRADES } from '../../../data/students.js';
import { useToast } from '../../../context/ToastContext.jsx';
import StudentTable from './StudentTable.jsx';
import StudentCards from './StudentCards.jsx';
import { downloadCsv } from './csv.js';

const CAMPUSES = [...new Set(students.map((s) => s.campus))].sort();
const NO_FILTERS = { major: '', grade: '', campus: '', status: '' };
const FILTERS = [
  { key: 'major', label: 'All majors', options: MAJORS },
  { key: 'grade', label: 'All grades', options: GRADES },
  { key: 'campus', label: 'All campuses', options: CAMPUSES },
  { key: 'status', label: 'All statuses', options: ['Active', 'At risk'] },
];

// Returns a compare function for Array.prototype.sort, one per column.
function compareBy(key) {
  if (key === 'name') {
    return (a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
  }
  if (key === 'score') return (a, b) => a.score - b.score;
  if (key === 'grade') return (a, b) => GRADES.indexOf(b.grade) - GRADES.indexOf(a.grade); // N → HD
  return (a, b) => String(a[key]).localeCompare(String(b[key]));
}

export default function StudentExplorer() {
  const { showToast } = useToast();

  // --- state: only what the user decided -------------------------------
  const [rows, setRows] = useState(students); // a local copy so bulk actions can edit it
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [view, setView] = useState('table'); // 'table' | 'cards'

  // --- derived data: recomputed from state, never stored ----------------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchesQuery = !q || name.includes(q) || s.email.includes(q) || s.studentId.includes(q);
      // every() → the row must pass ALL active filters ('' means "any")
      const matchesFilters = Object.entries(filters).every(([key, value]) => !value || s[key] === value);
      return matchesQuery && matchesFilters;
    });
  }, [rows, query, filters]);

  const sorted = useMemo(() => {
    const copy = [...filtered].sort(compareBy(sort.key)); // sort() mutates – always sort a copy
    return sort.direction === 'asc' ? copy : copy.reverse();
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount); // never show a page that no longer exists
  const firstIndex = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(firstIndex, firstIndex + pageSize);

  const selectedRows = filtered.filter((s) => selectedIds.has(s.id));
  const hasFilters = query !== '' || Object.values(filters).some(Boolean);

  // --- event handlers ----------------------------------------------------
  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1); // new filter → back to page 1 (done here, not in an effect)
  }

  function clearFilters() {
    setQuery('');
    setFilters(NO_FILTERS);
    setPage(1);
  }

  function handleSort(key) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  }

  function toggleRow(id) {
    setSelectedIds((current) => {
      const next = new Set(current); // copy – never mutate state directly
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked) {
    setSelectedIds(checked ? new Set(filtered.map((s) => s.id)) : new Set());
  }

  function markSelected(status) {
    const ids = new Set(selectedRows.map((s) => s.id));
    setRows((current) => current.map((s) => (ids.has(s.id) ? { ...s, status } : s)));
    setSelectedIds(new Set());
    showToast({ type: 'success', title: 'Students updated', message: `${ids.size} marked as “${status}”.` });
  }

  function handleExport() {
    const exportRows = selectedRows.length > 0 ? selectedRows : sorted;
    downloadCsv(exportRows, 'students.csv');
    showToast({ type: 'info', title: 'CSV exported', message: `${exportRows.length} rows saved.` });
  }

  // The same selection props are passed to both views.
  const selection = {
    selectedIds,
    onToggleRow: toggleRow,
    onToggleAll: toggleAll,
    total: filtered.length,
    allSelected: filtered.length > 0 && selectedRows.length === filtered.length,
    someSelected: selectedRows.length > 0,
  };

  return (
    <div className="stack">
      <div className="data-toolbar">
        <div className="data-search">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            type="search"
            aria-label="Search students"
            placeholder="Search name, email or student ID…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {FILTERS.map(({ key, label, options }) => (
          <select
            key={key}
            className="input"
            aria-label={`Filter by ${key}`}
            value={filters[key]}
            onChange={(e) => updateFilter(key, e.target.value)}
          >
            <option value="">{label}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ))}
      </div>

      <div className="row-between">
        {/* aria-live announces the new count to screen-reader users */}
        <p className="m-0 small muted" aria-live="polite">
          {sorted.length === 0
            ? 'No results'
            : `Showing ${firstIndex + 1}–${firstIndex + pageRows.length} of ${sorted.length} students`}
          {hasFilters && (
            <>
              {' · '}
              <button type="button" className="data-link-button" onClick={clearFilters}>
                Clear filters
              </button>
            </>
          )}
        </p>
        <div className="row">
          <div className="btn-group" role="group" aria-label="Choose a view">
            <button
              type="button"
              className={`btn btn-sm ${view === 'table' ? 'active' : ''}`}
              aria-pressed={view === 'table'}
              onClick={() => setView('table')}
            >
              <Table2 size={15} /> Table
            </button>
            <button
              type="button"
              className={`btn btn-sm ${view === 'cards' ? 'active' : ''}`}
              aria-pressed={view === 'cards'}
              onClick={() => setView('cards')}
            >
              <LayoutGrid size={15} /> Cards
            </button>
          </div>
          <button type="button" className="btn btn-sm" onClick={handleExport} disabled={sorted.length === 0}>
            <Download size={15} /> Export {selectedRows.length > 0 ? `${selectedRows.length} selected` : 'CSV'}
          </button>
        </div>
      </div>

      {selectedRows.length > 0 && (
        <div className="data-bulkbar" role="region" aria-label="Bulk actions">
          <strong>{selectedRows.length} selected</strong>
          <button type="button" className="btn btn-sm" onClick={() => markSelected('Active')}>
            Mark active
          </button>
          <button type="button" className="btn btn-sm" onClick={() => markSelected('At risk')}>
            Mark at risk
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      {/* Same data, three possible views: empty state, table or cards */}
      {sorted.length === 0 ? (
        <div className="data-empty">
          <SearchX size={32} aria-hidden="true" />
          <strong>No students match your search</strong>
          <button type="button" className="btn btn-sm" onClick={clearFilters}>
            Clear search and filters
          </button>
        </div>
      ) : view === 'table' ? (
        <StudentTable rows={pageRows} sort={sort} onSort={handleSort} {...selection} />
      ) : (
        <StudentCards rows={pageRows} {...selection} />
      )}

      <nav className="data-pagination" aria-label="Pagination">
        <label className="row small">
          Rows per page
          <select
            className="input"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value)); // <select> values are always strings
              setPage(1);
            }}
          >
            {[5, 10, 20].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="row">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="small">
            Page {currentPage} of {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === pageCount}
          >
            Next
          </button>
        </div>
      </nav>
    </div>
  );
}
