/**
 * CreateStudent – POST /api/students with validation on BOTH sides.
 *
 *   201 Created  → toast, empty the form, tell the other demos (notifyChange)
 *   422 invalid  → FastAPI lists every bad field → shown under that field
 *   409 conflict → "Student ID … already exists" under the student ID field
 *
 * Switch "Check in the browser first" off to send anything and watch
 * Pydantic reject it – proof that the server never trusts the client.
 *
 * Keyboard focus: the fields are disabled while sending, and a disabled field
 * cannot take focus. So the "jump to the first problem" happens in an effect,
 * AFTER React has re-rendered with the fields enabled again.
 */
import { useEffect, useRef, useState } from 'react';
import { Copy, UserPlus, WandSparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import { fieldErrorsOf, CAMPUSES, MAJORS, studentsApi } from './studentsApi.js';
import { useHighlightedId, useStudentsData } from './StudentsData.jsx';
import useStudents from './useStudents.js';
import StudentFields, { EMPTY_STUDENT, toPayload, validateStudent } from './StudentFields.jsx';
import { fullName, GradeBadge, RequestError, STATUS_TEXT } from './StudentBits.jsx';

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const digits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

/** A random, valid, fictional student for the "Fill example" button. */
function exampleStudent() {
  const first = pick(['Juno', 'Ezra', 'Noor', 'Remy', 'Tess', 'Arlo', 'Lina', 'Otto', 'Kiri', 'Sami']);
  const last = pick(['Marsh', 'Quill', 'Vance', 'Hollis', 'Reyes', 'Adler', 'Byrne', 'Okoro', 'Lund', 'Faro']);
  return {
    student_id: `109${digits(6)}`, first_name: first, last_name: last,
    email: `${first}.${last}${digits(2)}@student.example.edu`.toLowerCase(),
    major: pick(MAJORS), campus: pick(CAMPUSES), year: pick(['1', '2', '3']),
    score: String(40 + Math.floor(Math.random() * 56)), status: 'active', enrolled: '2025-07-14',
  };
}

/** The request and the response as text, like a network log (the request body on one line). */
function describe({ body, status, response }) {
  const answer = status ? `← ${status} ${STATUS_TEXT[status] ?? ''}` : '← no response';
  return `POST /api/students\n${JSON.stringify(body)}\n\n${answer}\n${JSON.stringify(response, null, 2)}`;
}

export default function CreateStudent() {
  const { notifyChange } = useStudentsData();
  const { showToast } = useToast();
  const newest = useStudents({ sort: 'id', order: 'desc', page_size: 5 }); // "latest 5" list
  const highlightId = useHighlightedId();
  const formRef = useRef(null);
  const [values, setValues] = useState(EMPTY_STUDENT);
  const [errors, setErrors] = useState({});
  const [clientChecks, setClientChecks] = useState(true);
  const [sending, setSending] = useState(false);
  const [exchange, setExchange] = useState(null); // last request + response, for the panel
  const [requestError, setRequestError] = useState(null); // offline / 500 – not about one field
  const [summary, setSummary] = useState(''); // one short sentence for screen readers
  const [focusRequest, setFocusRequest] = useState(null); // { field } – a new object = focus again

  // Runs after the render that re-enabled the fields (see the note at the top).
  useEffect(() => {
    if (focusRequest) formRef.current?.elements.namedItem(focusRequest.field)?.focus();
  }, [focusRequest]);

  function handleChange(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined })); // typing clears that field's error
  }

  function showFieldErrors(fieldErrors, source) {
    const count = Object.keys(fieldErrors).length;
    setErrors(fieldErrors);
    setSummary(`${source}: ${count} field${count === 1 ? ' needs' : 's need'} attention.`);
    setFocusRequest({ field: Object.keys(fieldErrors)[0] }); // jump to the first problem
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (sending) return; // the button is only aria-disabled, so guard here
    const clientErrors = clientChecks ? validateStudent(values) : {};
    if (Object.keys(clientErrors).length > 0) {
      showFieldErrors(clientErrors, 'Checked in the browser'); // stop here – no request is sent at all
      return;
    }

    const body = toPayload(values);
    setSending(true);
    setRequestError(null);
    setSummary('');
    try {
      const created = await studentsApi.create(body);
      setExchange({ body, status: 201, response: created });
      setValues(EMPTY_STUDENT);
      setErrors({});
      notifyChange({ type: 'created', id: created.id }); // → table, stats and lists refetch
      showToast({ type: 'success', title: 'Student created', message: `${fullName(created)} was saved with id ${created.id}.` });
    } catch (error) {
      setExchange({ body, status: error.status, response: error.isOffline ? error.message : { detail: error.detail } });
      const fieldErrors = fieldErrorsOf(error); // 422 or 409 → { field: message }
      if (Object.keys(fieldErrors).length > 0) showFieldErrors(fieldErrors, `${error.status} from FastAPI`);
      else setRequestError(error);
    } finally {
      setSending(false);
    }
  }

  function duplicateExisting() {
    const existing = newest.data?.items.at(-1);
    if (existing) setValues({ ...exampleStudent(), student_id: existing.student_id });
    setErrors({});
  }

  return (
    <div className="crud-split">
      <form ref={formRef} className="stack" onSubmit={handleSubmit} noValidate aria-label="Create a student">
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={() => { setValues(exampleStudent()); setErrors({}); }}>
            <WandSparkles size={14} /> Fill example
          </button>
          <button type="button" className="btn btn-sm" onClick={duplicateExisting} disabled={!newest.data?.items.length}>
            <Copy size={14} /> Use an existing student ID
          </button>
        </div>

        <StudentFields values={values} errors={errors} onChange={handleChange} disabled={sending} />

        <div className="row-between">
          <label className="switch small">
            <input type="checkbox" checked={clientChecks} onChange={(e) => setClientChecks(e.target.checked)} />
            <span className="switch-track" /> Check in the browser first
          </label>
          {/* aria-disabled instead of disabled: a disabled button loses keyboard focus */}
          <button type="submit" className="btn btn-primary" aria-disabled={sending}>
            {sending ? <span className="spinner crud-spinner-sm" aria-hidden="true" /> : <UserPlus size={16} />}
            {sending ? 'Saving…' : 'Create student'}
          </button>
        </div>
        <p className="visually-hidden" role="status">{summary}</p>
        <RequestError error={requestError} />
      </form>

      <div className="stack">
        <div>
          <h4 className="crud-panel-title">Newest students</h4>
          <ol className="crud-mini-list" aria-busy={newest.loading}>
            {newest.data?.items.map((s) => (
              <li key={s.id} className={s.id === highlightId ? 'crud-row-flash' : undefined}>
                <span className="mono small subtle">#{s.id}</span>
                <span className="crud-mini-name">{fullName(s)}</span>
                <GradeBadge grade={s.grade} />
              </li>
            ))}
          </ol>
          <RequestError error={newest.error} onRetry={newest.refetch} />
        </div>

        <div>
          <h4 className="crud-panel-title">Last request</h4>
          <pre className="demo-output crud-mono-panel">
            {exchange ? describe(exchange) : 'Submit the form to see the request body and FastAPI’s answer.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
