/**
 * EditStudent – pick a row, edit it in a dialog, save with PATCH.
 *
 * The list re-fetches by itself after a save because EditDialog calls
 * notifyChange() (see StudentsData.jsx), and the saved row is highlighted.
 * Only ONE dialog exists at a time: `editing` holds the student being edited.
 */
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import useStudents from './useStudents.js';
import { useHighlightedId } from './StudentsData.jsx';
import EditDialog from './EditDialog.jsx';
import { GradeBadge, RequestError, StatusBadge } from './StudentBits.jsx';

export default function EditStudent() {
  const [page, setPage] = useState(1);
  const { data, error, loading, refetch } = useStudents({ sort: 'last_name', order: 'asc', page, page_size: 5 });
  const highlightId = useHighlightedId();
  const [editing, setEditing] = useState(null);
  const tableRef = useRef(null);

  function handleClose({ deleted }) {
    setEditing(null);
    // <dialog> gives focus back to the row's Edit button – but a deleted row is about to
    // vanish (and its button with it). Keep keyboard users on the table instead.
    if (deleted) tableRef.current?.focus();
  }

  // Deleting rows elsewhere can make the last page disappear → step back to a page that exists.
  if (data && data.pages > 0 && page > data.pages) setPage(data.pages);

  return (
    <div className="stack">
      <RequestError error={error} onRetry={refetch} />

      <div ref={tableRef} tabIndex={-1} className={`table-wrap crud-table-wrap ${loading && data ? 'crud-is-loading' : ''}`} aria-busy={loading}>
        <table className="table crud-table">
          <caption className="visually-hidden">Students you can edit (sorted by last name)</caption>
          <thead>
            <tr><th>Name</th><th className="crud-hide-sm">Major</th><th className="num">Score</th><th>Grade</th><th className="crud-hide-sm">Status</th><th><span className="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            {data?.items.map((s) => (
              <tr key={s.id} className={s.id === highlightId ? 'crud-row-flash' : undefined}>
                <td><strong>{s.last_name}</strong>, {s.first_name}</td>
                <td className="crud-hide-sm">{s.major}</td>
                <td className="num">{s.score}</td>
                <td><GradeBadge grade={s.grade} /></td>
                <td className="crud-hide-sm"><StatusBadge status={s.status} /></td>
                <td className="crud-actions">
                  <button type="button" className="btn btn-sm" onClick={() => setEditing(s)} aria-label={`Edit ${s.first_name} ${s.last_name}`}>
                    {/* On phones only the icon shows (CSS); aria-label still names the button */}
                    <Pencil size={14} aria-hidden="true" /> <span className="crud-btn-label">Edit</span>
                  </button>
                </td>
              </tr>
            ))}
            {!data && <tr><td colSpan={6} className="center muted crud-empty">{loading ? 'Loading…' : 'No data yet.'}</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="row">
        <button type="button" className="btn btn-sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1 || !data}>
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="small muted">Page {page} of {Math.max(1, data?.pages ?? 1)}</span>
        <button type="button" className="btn btn-sm" onClick={() => setPage((p) => p + 1)} disabled={!data || page >= data.pages}>
          Next <ChevronRight size={14} />
        </button>
      </div>

      {/* key: a different student → a fresh dialog with fresh form state */}
      {editing && <EditDialog key={editing.id} student={editing} onClose={handleClose} />}
    </div>
  );
}
