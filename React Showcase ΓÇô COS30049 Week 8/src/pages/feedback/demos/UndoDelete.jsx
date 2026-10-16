/**
 * UndoDelete – "Delete with Undo" instead of "Are you sure?".
 *
 * 1. The item disappears immediately (optimistic UI) and we remember it in
 *    `pending` together with its old position.
 * 2. A snackbar offers "Undo" for 5 seconds. The timer lives in a useEffect
 *    that re-starts whenever `pending` changes and is cleared in the cleanup.
 * 3. Undo puts the item back where it was. If the timer runs out, the delete
 *    becomes final – that is where a real app would call its API.
 */
import { useEffect, useState } from 'react';
import { FileText, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import styles from './UndoDelete.module.css';

const UNDO_MS = 5000;
const INITIAL_NOTES = [
  { id: 1, name: 'Lab 6 – Props and state.md' },
  { id: 2, name: 'Lab 7 – useEffect notes.md' },
  { id: 3, name: 'Group meeting minutes (Week 8).md' },
  { id: 4, name: 'Assignment 3 wireframes.md' },
];

export default function UndoDelete() {
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [pending, setPending] = useState(null); // { note, index } or null
  const { showToast } = useToast();

  useEffect(() => {
    if (!pending) return undefined;
    const timer = setTimeout(() => {
      setPending(null);
      // Real app: await fetch(`/api/notes/${pending.note.id}`, { method: 'DELETE' });
      showToast({ type: 'info', title: 'Deleted for good', message: pending.note.name, duration: 2500 });
    }, UNDO_MS);
    return () => clearTimeout(timer); // undo or another delete → cancel this timer
  }, [pending, showToast]);

  function handleDelete(note) {
    const index = notes.findIndex((n) => n.id === note.id);
    setNotes((current) => current.filter((n) => n.id !== note.id));
    setPending({ note, index }); // replaces (and so finalises) any earlier pending delete
  }

  function handleUndo() {
    const { note, index } = pending;
    setNotes((current) => [...current.slice(0, index), note, ...current.slice(index)]);
    setPending(null);
  }

  return (
    <div className={styles.wrapper}>
      <ul className={styles.list}>
        {notes.map((note) => (
          <li key={note.id} className={styles.item}>
            <FileText size={16} aria-hidden="true" />
            <span className={styles.name}>{note.name}</span>
            <button type="button" className="btn-icon" onClick={() => handleDelete(note)} aria-label={`Delete ${note.name}`}>
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        {notes.length === 0 && (
          <li className={styles.empty}>
            No notes left.
            <button type="button" className="btn btn-sm" onClick={() => setNotes(INITIAL_NOTES)}>
              <RotateCcw size={14} aria-hidden="true" /> Restore demo data
            </button>
          </li>
        )}
      </ul>

      {/* The live region is always rendered; only its content changes. */}
      <div role="status" aria-live="polite" className={styles.snackbarSlot}>
        {pending && (
          <div className={styles.snackbar}>
            <span>Deleted “{pending.note.name}”</span>
            <button type="button" className={styles.undo} onClick={handleUndo}>Undo</button>
            {/* key restarts the CSS countdown animation for every new delete */}
            <span key={pending.note.id} className={styles.countdown} style={{ animationDuration: `${UNDO_MS}ms` }} />
          </div>
        )}
      </div>
    </div>
  );
}
