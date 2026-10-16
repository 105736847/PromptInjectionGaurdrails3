/**
 * EditDialog – edit one student in a modal and save with PATCH.
 *
 * PATCH vs PUT: PUT replaces the WHOLE record (send all 10 fields); PATCH
 * changes only the fields you send. We compare the form with the original
 * during render and send just the difference – shown live in the payload box.
 *
 * Uses the native <dialog> element: showModal() traps focus, Esc closes it,
 * and focus returns to the "Edit" button afterwards – accessibility for free.
 * After a failed save, an effect moves focus to what needs attention (the
 * fields are disabled while sending, and a disabled field cannot take focus).
 */
import { useEffect, useRef, useState } from 'react';
import { Save, Trash2, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import { fieldErrorsOf, studentsApi } from './studentsApi.js';
import { useStudentsData } from './StudentsData.jsx';
import StudentFields, { toFormValues, toPayload, validateStudent } from './StudentFields.jsx';
import { fullName, RequestError } from './StudentBits.jsx';

export default function EditDialog({ student, onClose }) {
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const goneButtonRef = useRef(null);
  const saveRef = useRef(null);
  const { notifyChange } = useStudentsData();
  const { showToast } = useToast();
  const [values, setValues] = useState(() => toFormValues(student));
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState(null); // 'gone' (404) or an ApiError
  const [deletedBehindYourBack, setDeletedBehindYourBack] = useState(false);
  const [focusRequest, setFocusRequest] = useState(null); // { field } after a 409 / 422

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal(); // the guard makes the effect safe to run twice (StrictMode)
  }, []);

  // After the re-render that enabled the fields again: first invalid field …
  useEffect(() => {
    if (focusRequest) formRef.current?.elements.namedItem(focusRequest.field)?.focus();
  }, [focusRequest]);
  // … or, after a 404, the only useful button left …
  useEffect(() => {
    if (problem === 'gone') goneButtonRef.current?.focus();
  }, [problem]);
  // … or Save, once "another user" has deleted the record (the Simulate button disables itself).
  useEffect(() => {
    if (deletedBehindYourBack) saveRef.current?.focus();
  }, [deletedBehindYourBack]);

  // Derived during render: only the fields whose value differs from the original.
  const original = toPayload(toFormValues(student));
  const changes = Object.fromEntries(Object.entries(toPayload(values)).filter(([key, value]) => value !== original[key]));
  const changedCount = Object.keys(changes).length;

  function handleChange(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function showFieldErrors(fieldErrors) {
    setErrors(fieldErrors);
    setFocusRequest({ field: Object.keys(fieldErrors)[0] });
  }

  async function handleSave(event) {
    event.preventDefault();
    if (sending) return; // Save is only aria-disabled while sending (it keeps focus)
    const clientErrors = validateStudent(values);
    if (Object.keys(clientErrors).length > 0) {
      showFieldErrors(clientErrors);
      return;
    }
    setSending(true);
    setProblem(null);
    try {
      const updated = await studentsApi.update(student.id, changes);
      notifyChange({ type: 'updated', id: updated.id });
      showToast({ type: 'success', title: 'Saved with PATCH', message: `${fullName(updated)}: ${Object.keys(changes).join(', ')} updated.` });
      dialogRef.current?.close(); // → onClose → the parent unmounts the dialog
    } catch (error) {
      const fieldErrors = fieldErrorsOf(error);
      if (error.status === 404) {
        setProblem('gone'); // someone deleted it meanwhile – old field errors no longer matter
        setErrors({});
      }
      else if (Object.keys(fieldErrors).length > 0) showFieldErrors(fieldErrors); // 422 / 409
      else setProblem(error);
    } finally {
      setSending(false);
    }
  }

  // Teaching aid: play "another user" and delete the record behind the dialog's back.
  async function simulateOtherUser() {
    try {
      await studentsApi.remove(student.id);
      setDeletedBehindYourBack(true);
    } catch (error) {
      setProblem(error);
    }
  }

  // Runs however the dialog closes (Save, Cancel, ×, Esc). If the record is gone,
  // tell the other demos so their lists refetch and the row disappears.
  function handleClosed() {
    const deleted = problem === 'gone' || deletedBehindYourBack;
    if (deleted) notifyChange({ type: 'deleted', id: student.id });
    onClose({ deleted });
  }

  const titleId = `crud-edit-title-${student.id}`;
  return (
    <dialog ref={dialogRef} className="crud-dialog" onClose={handleClosed} aria-labelledby={titleId}>
      <form ref={formRef} onSubmit={handleSave} noValidate className="crud-dialog-form">
        <header className="crud-dialog-header">
          <h3 id={titleId} className="m-0">Edit {fullName(student)} <span className="mono small subtle">#{student.id}</span></h3>
          <button type="button" className="btn-icon" onClick={() => dialogRef.current.close()} aria-label="Close dialog"><X size={18} /></button>
        </header>

        <div className="crud-dialog-body stack">
          {problem === 'gone' ? (
            <div className="alert alert-warning" role="alert">
              <div>
                <strong>404 – this student no longer exists.</strong> Someone else deleted it while you were editing, so
                there is nothing left to update.
                <div className="mt-1">
                  <button type="button" ref={goneButtonRef} className="btn btn-sm" onClick={() => dialogRef.current.close()}>Close and refresh the list</button>
                </div>
              </div>
            </div>
          ) : (
            <RequestError error={problem} />
          )}

          <StudentFields values={values} errors={errors} onChange={handleChange} disabled={sending || problem === 'gone'} />

          <div>
            <h4 className="crud-panel-title">Request that Save will send</h4>
            {/* Screen readers hear a short count, not the whole JSON on every key press. */}
            <p className="visually-hidden" aria-live="polite">
              {changedCount > 0 ? `${changedCount} field${changedCount === 1 ? '' : 's'} changed.` : ''}
            </p>
            <pre className="demo-output crud-mono-panel">
              {changedCount > 0 || deletedBehindYourBack
                ? `PATCH /api/students/${student.id}\n${JSON.stringify(changes, null, 2)}`
                : 'No changes yet – edit a field and the JSON body appears here.'}
            </pre>
            <p className="hint mt-1">A PUT would have to send all 10 fields, even the ones you did not touch.</p>
          </div>
        </div>

        <footer className="crud-dialog-footer">
          <button type="button" className="btn btn-sm btn-ghost crud-danger-text" onClick={simulateOtherUser}
            disabled={deletedBehindYourBack || problem === 'gone'}>
            <Trash2 size={14} /> {deletedBehindYourBack ? 'Deleted on the server – now press Save' : 'Simulate: another user deletes this student'}
          </button>
          <div className="row">
            <button type="button" className="btn" onClick={() => dialogRef.current.close()}>Cancel</button>
            {/* Nothing changed → nothing to send. Unless the record was deleted meanwhile:
                then even an empty PATCH shows the 404 this walkthrough is about. */}
            <button type="submit" ref={saveRef} className="btn btn-primary" aria-disabled={sending}
              disabled={(changedCount === 0 && !deletedBehindYourBack) || problem === 'gone'}>
              <Save size={16} /> {sending ? 'Saving…' : changedCount > 0 ? `Save ${changedCount} change${changedCount === 1 ? '' : 's'}` : 'Save changes'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
