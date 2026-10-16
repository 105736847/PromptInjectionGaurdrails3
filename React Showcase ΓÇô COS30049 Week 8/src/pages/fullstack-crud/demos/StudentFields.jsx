/**
 * StudentFields.jsx – the ten form fields of a student (shared by Create and Edit),
 * plus the client-side rules and the conversions between form and JSON.
 *
 * Client validation = instant, friendly feedback (good UX).
 * Server validation (Pydantic) = the real protection: anyone can skip this
 * JavaScript with curl, Postman or /api/docs. Keep both in sync – the server wins.
 */
import { useId } from 'react';
import { CAMPUSES, MAJORS, STATUSES } from './studentsApi.js';

const NUMBER_FIELDS = new Set(['year', 'score']);

// 'en-CA' formats dates as YYYY-MM-DD – the format <input type="date"> uses.
// The browser's local date is never later than the server's check (UTC+14).
export const todayIso = () => new Date().toLocaleDateString('en-CA');
const FIRST_ENROLMENT = '2000-01-01'; // FIRST_ENROLMENT in student.py

export const EMPTY_STUDENT = {
  student_id: '', first_name: '', last_name: '', email: '', major: '',
  campus: 'Hawthorn', year: '1', score: '', status: 'active', enrolled: '2026-02-23',
};

/** API object → form values. Inputs always hold STRINGS (even type="number"). */
export function toFormValues(student) {
  return Object.fromEntries(Object.keys(EMPTY_STUDENT).map((name) => [name, String(student[name] ?? '')]));
}

/** Form values → JSON body: trimmed text, real numbers, empty fields left out. */
export function toPayload(values) {
  const payload = {};
  for (const [name, raw] of Object.entries(values)) {
    const value = raw.trim();
    if (value === '') continue; // missing → the server answers "Field required"
    payload[name] = NUMBER_FIELDS.has(name) && !Number.isNaN(Number(value)) ? Number(value) : value;
  }
  return payload;
}

/** The same rules as backend/app/models/student.py, as { field: message }. */
export function validateStudent(v) {
  const errors = {};
  if (!/^[0-9]{9}$/.test(v.student_id.trim())) errors.student_id = 'Student ID must be exactly 9 digits.';
  for (const [name, label] of [['first_name', 'First name'], ['last_name', 'Last name']]) {
    if (!v[name].trim()) errors[name] = `${label} is required.`;
    else if (v[name].trim().length > 50) errors[name] = `${label} can be at most 50 characters.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'Enter a valid email address.';
  if (!v.major) errors.major = 'Choose a major.';
  const score = Number(v.score);
  if (v.score.trim() === '' || Number.isNaN(score) || score < 0 || score > 100) errors.score = 'Score must be between 0 and 100.';
  if (!v.enrolled) errors.enrolled = 'Enrolment date is required.';
  else if (v.enrolled < FIRST_ENROLMENT) errors.enrolled = 'Enrolment date must be in 2000 or later.';
  else if (v.enrolled > todayIso()) errors.enrolled = 'Enrolment date cannot be in the future.';
  return errors;
}

/** One labelled field with its error message wired up for screen readers. */
function Field({ id, label, error, wide, children }) {
  return (
    <div className={`field ${wide ? 'crud-field-wide' : ''}`}>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
      {error && <p className="error-text" id={`${id}-error`}>{error}</p>}
    </div>
  );
}

export default function StudentFields({ values, errors, onChange, disabled }) {
  const uid = useId();
  // Props every input needs – written once instead of ten times.
  const bind = (name) => ({
    id: `${uid}-${name}`,
    name,
    className: 'input',
    value: values[name],
    disabled,
    onChange: (event) => onChange(name, event.target.value),
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${uid}-${name}-error` : undefined,
  });
  const field = (name, label, wide) => ({ id: `${uid}-${name}`, label, error: errors[name], wide });

  return (
    <div className="crud-form-grid">
      <Field {...field('student_id', 'Student ID (9 digits)')}>
        <input {...bind('student_id')} inputMode="numeric" autoComplete="off" placeholder="109912345" />
      </Field>
      <Field {...field('first_name', 'First name')}>
        <input {...bind('first_name')} autoComplete="off" />
      </Field>
      <Field {...field('last_name', 'Last name')}>
        <input {...bind('last_name')} autoComplete="off" />
      </Field>
      <Field {...field('email', 'Email', true)}>
        <input {...bind('email')} type="email" autoComplete="off" placeholder="name@student.example.edu" />
      </Field>
      <Field {...field('major', 'Major', true)}>
        <select {...bind('major')}>
          <option value="">Choose a major…</option>
          {MAJORS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </Field>
      <Field {...field('campus', 'Campus')}>
        <select {...bind('campus')}>{CAMPUSES.map((c) => <option key={c}>{c}</option>)}</select>
      </Field>
      <Field {...field('year', 'Year')}>
        <select {...bind('year')}>{[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}</select>
      </Field>
      <Field {...field('score', 'Score (0–100)')}>
        <input {...bind('score')} type="number" step="0.5" inputMode="decimal" />
      </Field>
      <Field {...field('status', 'Status')}>
        <select {...bind('status')}>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
      </Field>
      <Field {...field('enrolled', 'Enrolled on')}>
        <input {...bind('enrolled')} type="date" min={FIRST_ENROLMENT} max={todayIso()} />
      </Field>
    </div>
  );
}
