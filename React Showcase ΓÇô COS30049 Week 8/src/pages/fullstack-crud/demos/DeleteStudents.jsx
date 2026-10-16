/**
 * DeleteStudents – an OPTIMISTIC delete with rollback and undo.
 *
 * Optimistic = change the screen first, ask the server second:
 *   1. hide the row immediately                  → the app feels instant
 *   2. send DELETE /api/students/{id}
 *   3a. 204 No Content → keep it hidden and offer "Undo" for 5 seconds
 *   3b. any error      → ROLLBACK: show the row again + an error toast
 * DELETE really removed the row, so Undo creates it again with POST.
 *
 * Keyboard users: when the focused button disappears (its row is hidden, the
 * Undo bar closes), focus would fall back to <body>. focusSoon() moves it to a
 * sensible button instead, and the countdown pauses while the Undo bar is
 * hovered or focused – everyone must be able to beat a time limit (WCAG 2.2.1).
 */
import { useEffect, useRef, useState } from 'react';
import { Trash2, Undo2 } from 'lucide-react';
import { ApiError } from '../../../api/client.js';
import { useToast } from '../../../context/ToastContext.jsx';
import useStudents from './useStudents.js';
import { studentsApi, toCreatePayload } from './studentsApi.js';
import { useHighlightedId, useStudentsData } from './StudentsData.jsx';
import { fullName, GradeBadge, RequestError } from './StudentBits.jsx';

const UNDO_MS = 5000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deleteButton = (id) => `[data-delete="${id}"]`;

export default function DeleteStudents() {
  const { data, error, loading, refetch } = useStudents({ sort: 'id', order: 'desc', page_size: 6 }); // newest first
  const { notifyChange } = useStudentsData();
  const { showToast } = useToast();
  const highlightId = useHighlightedId();
  const rootRef = useRef(null);
  const focusTarget = useRef(null); // a CSS selector to focus as soon as it is on screen
  const [hiddenIds, setHiddenIds] = useState(() => new Set()); // rows removed optimistically
  const [pending, setPending] = useState(0); // DELETE requests still waiting for an answer
  const [confirmId, setConfirmId] = useState(null);
  const [undo, setUndo] = useState(null); // { student } while "Undo" is offered
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [slow, setSlow] = useState(true);
  const [fail, setFail] = useState(false);
  const paused = hovered || focused;

  // Derived during render: what the server sent, minus what we hid.
  const rows = (data?.items ?? []).filter((s) => !hiddenIds.has(s.id));

  // New data from the server is the truth: forget hidden ids it no longer returns (really
  // deleted). Otherwise "Reset demo data", which brings back the SAME ids, stays hidden here.
  useEffect(() => {
    if (!data) return;
    setHiddenIds((current) => {
      const kept = [...current].filter((id) => data.items.some((s) => s.id === id));
      return kept.length === current.size ? current : new Set(kept);
    });
  }, [data]);

  // The Undo offer disappears after 5 s. Pausing (or a newer offer, or unmounting) clears the timer.
  useEffect(() => {
    if (!undo || paused) return undefined;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo, paused]);

  // No dependency array: after EVERY render, focus the requested element if it exists by now
  // (a restored row only appears after the refetch). Never steal focus from another demo.
  useEffect(() => {
    const element = focusTarget.current && rootRef.current?.querySelector(focusTarget.current);
    if (!element) return;
    focusTarget.current = null;
    const active = document.activeElement;
    if (!active || active === document.body || rootRef.current.contains(active)) element.focus();
  });
  const focusSoon = (selector) => { focusTarget.current = selector; };

  function setHidden(id, hidden) {
    setHiddenIds((current) => {
      const next = new Set(current); // never mutate state: copy, then change the copy
      if (hidden) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleDelete(student, viaKeyboard) {
    // "Yes, delete" vanishes with its row → focus the next row's Delete button instead.
    const index = rows.findIndex((s) => s.id === student.id);
    const neighbour = rows[index + 1] ?? rows[index - 1];
    focusSoon(neighbour ? deleteButton(neighbour.id) : '.crud-table-wrap');
    setConfirmId(null);
    setHidden(student.id, true); // 1. optimistic – the row is gone NOW
    setPending((n) => n + 1);
    try {
      if (slow) await sleep(1500); // teaching aid: a slow network makes step 1 visible
      if (fail) throw new ApiError('Simulated 500 – the database is locked.', { status: 500 });
      await studentsApi.remove(student.id); // 2. ask the server
      notifyChange({ type: 'deleted', id: student.id });
      if (viaKeyboard) focusSoon('[data-undo]'); // focusing the bar also pauses its countdown
      setUndo({ student }); // 3a. success
    } catch (err) {
      if (err.status === 404) {
        notifyChange({ type: 'deleted', id: student.id }); // already gone = exactly what we wanted
        return;
      }
      setHidden(student.id, false); // 3b. ROLLBACK – the row comes back in the same place
      focusSoon(deleteButton(student.id));
      showToast({ type: 'error', title: `Could not delete ${fullName(student)}`, message: `${err.message} The row is back.` });
    } finally {
      setPending((n) => n - 1);
    }
  }

  async function handleUndo() {
    const { student } = undo;
    setUndo(null);
    setHovered(false); // the bar disappears, so it is neither hovered nor focused any more
    setFocused(false);
    try {
      const restored = await studentsApi.create(toCreatePayload(student)); // same data, NEW id
      focusSoon(deleteButton(restored.id)); // once the refetch has put the row back
      notifyChange({ type: 'created', id: restored.id });
      showToast({ type: 'success', title: 'Delete undone', message: `${fullName(restored)} is back with the new id ${restored.id}.` });
    } catch (err) {
      showToast({ type: 'error', title: 'Undo failed', message: err.message });
    }
  }

  function cancelConfirm(id) {
    focusSoon(deleteButton(id)); // back to the Delete button the user came from
    setConfirmId(null);
  }

  return (
    <div className="stack" ref={rootRef}>
      <div className="row">
        <label className="switch small">
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
          <span className="switch-track" /> Slow network (1.5 s)
        </label>
        <label className="switch small">
          <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} />
          <span className="switch-track" /> Simulate a server error (no request is sent)
        </label>
      </div>

      <RequestError error={error} onRetry={refetch} />

      <div className="table-wrap crud-table-wrap" tabIndex={-1} aria-busy={loading}>
        <table className="table crud-table">
          <caption className="visually-hidden">The six newest students</caption>
          <thead>
            <tr><th className="num">Id</th><th>Name</th><th className="crud-hide-sm">Major</th><th className="crud-hide-sm">Grade</th><th><span className="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className={s.id === highlightId ? 'crud-row-flash' : undefined}>
                <td className="num mono small">{s.id}</td>
                <td><strong>{s.last_name}</strong>, {s.first_name}</td>
                <td className="crud-hide-sm">{s.major}</td>
                <td className="crud-hide-sm"><GradeBadge grade={s.grade} /></td>
                <td className="crud-actions">
                  {confirmId === s.id ? (
                    <span className="row crud-confirm" onKeyDown={(e) => e.key === 'Escape' && cancelConfirm(s.id)}>
                      <span className="small">Delete {s.first_name}?</span>
                      {/* event.detail = number of clicks; 0 means Enter or Space on the keyboard */}
                      <button type="button" className="btn btn-sm btn-danger" onClick={(e) => handleDelete(s, e.detail === 0)}>Yes, delete</button>
                      {/* autoFocus on the SAFE choice: pressing Enter by accident does not delete */}
                      <button type="button" className="btn btn-sm" autoFocus onClick={() => cancelConfirm(s.id)}>Cancel</button>
                    </span>
                  ) : (
                    <button type="button" className="btn btn-sm btn-ghost crud-danger-text" data-delete={s.id}
                      onClick={() => setConfirmId(s.id)} aria-label={`Delete ${fullName(s)}`}>
                      <Trash2 size={14} aria-hidden="true" /> <span className="crud-btn-label">Delete</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!data && <tr><td colSpan={5} className="center muted crud-empty">{loading ? 'Loading…' : 'No data yet.'}</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="small muted m-0" role="status">
        Rows from the server: {data?.items.length ?? 0} · hidden optimistically: {(data?.items.length ?? 0) - rows.length}
        {pending > 0 && <strong> · waiting for FastAPI ({pending})…</strong>}
      </p>

      {/* The live region is always rendered, so screen readers announce the offer when it appears. */}
      <div role="status">
        {undo && (
          <div className="crud-undo" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
            <span>Deleted <strong>{fullName(undo.student)}</strong>.</span>
            <button type="button" className="btn btn-sm btn-secondary" data-undo onClick={handleUndo}><Undo2 size={14} aria-hidden="true" /> Undo</button>
            {paused ? (
              <span className="small muted">Timer paused</span>
            ) : (
              // key → a new offer (or resuming) remounts the bar, so the countdown animation restarts
              <span key={undo.student.id} className="crud-undo-timer" style={{ animationDuration: `${UNDO_MS}ms` }} aria-hidden="true" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
