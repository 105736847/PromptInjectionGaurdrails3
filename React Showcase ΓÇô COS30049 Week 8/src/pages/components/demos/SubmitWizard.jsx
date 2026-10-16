/**
 * SubmitWizard – a multi-step form ("stepper") for submitting an assignment.
 *
 * - One `step` number decides which part of the form is shown.
 * - All answers live in ONE `form` object, so going Back never loses data.
 * - validate(step, form) is a plain function; "Next" only advances when it
 *   returns no errors.
 * - After each step change we move focus to the step heading, so keyboard and
 *   screen-reader users know that the content changed.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import styles from './SubmitWizard.module.css';

const STEPS = ['Details', 'Upload', 'Review', 'Done'];
const EMPTY_FORM = { unit: '', title: '', file: null, declaration: false };
const MAX_MB = 10;

function validate(step, form) {
  const errors = {};
  if (step === 0) {
    if (!form.unit) errors.unit = 'Choose a unit.';
    if (form.title.trim().length < 3) errors.title = 'Give your submission a title (3+ characters).';
  }
  if (step === 1) {
    if (!form.file) errors.file = 'Attach your report.';
    else if (!/\.(pdf|zip)$/i.test(form.file.name)) errors.file = 'Only .pdf or .zip files are accepted.';
    else if (form.file.size > MAX_MB * 1024 * 1024) errors.file = `The file must be smaller than ${MAX_MB} MB.`;
  }
  if (step === 2 && !form.declaration) errors.declaration = 'You must confirm the declaration.';
  return errors;
}

export default function SubmitWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [receipt, setReceipt] = useState(null);
  const id = useId();
  const headingRef = useRef(null);
  const movedByUser = useRef(false); // don't steal focus when the page first loads

  useEffect(() => {
    if (movedByUser.current) headingRef.current?.focus();
  }, [step]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  function goTo(nextStep) {
    movedByUser.current = true;
    setErrors({});
    setStep(nextStep);
  }

  function handleNext(event) {
    event.preventDefault(); // this runs as the form's onSubmit, so Enter also works
    const stepErrors = validate(step, form);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    if (step === 2) setReceipt(`${form.unit}-${Date.now().toString(36).toUpperCase()}`);
    goTo(step + 1);
  }

  function restart() {
    setForm(EMPTY_FORM);
    setReceipt(null);
    goTo(0);
  }

  return (
    <form className="stack-lg" onSubmit={handleNext} noValidate>
      {/* Progress indicator */}
      <ol className={styles.steps}>
        {STEPS.map((label, index) => {
          const status = index < step ? 'complete' : index === step ? 'current' : 'upcoming';
          return (
            <li key={label} className={styles.step} data-status={status} aria-current={status === 'current' ? 'step' : undefined}>
              <span className={styles.bubble}>{status === 'complete' ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
              <span className={styles.stepLabel}>{label}</span>
              <span className="visually-hidden">{status === 'complete' ? '(completed)' : ''}</span>
            </li>
          );
        })}
      </ol>

      <h4 ref={headingRef} tabIndex={-1} className={styles.heading}>
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </h4>

      {step === 0 && (
        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor={`${id}-unit`}>Unit <span className="required">*</span></label>
            <select id={`${id}-unit`} className="input" value={form.unit} onChange={(e) => update('unit', e.target.value)} aria-invalid={Boolean(errors.unit)}>
              <option value="">Select…</option>
              <option value="COS30049">COS30049 – Innovation Project</option>
              <option value="COS30043">COS30043 – Interface Design</option>
            </select>
            {errors.unit && <p className="error-text">{errors.unit}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor={`${id}-title`}>Title <span className="required">*</span></label>
            <input id={`${id}-title`} className="input" value={form.title} onChange={(e) => update('title', e.target.value)} aria-invalid={Boolean(errors.title)} placeholder="Assignment 3 – Team 12" />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="field">
          <label className="label" htmlFor={`${id}-file`}>Report (.pdf or .zip, max {MAX_MB} MB) <span className="required">*</span></label>
          <input id={`${id}-file`} type="file" accept=".pdf,.zip" className="input" onChange={(e) => update('file', e.target.files[0] ?? null)} aria-invalid={Boolean(errors.file)} />
          <div className="row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => update('file', { name: 'team12-report.pdf', size: 1_450_000 })}>
              No file handy? Use a sample file
            </button>
            {form.file && <span className="small muted">Selected: {form.file.name} ({(form.file.size / 1024 / 1024).toFixed(1)} MB)</span>}
          </div>
          {errors.file && <p className="error-text">{errors.file}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="stack">
          <dl className={styles.summary}>
            <dt>Unit</dt><dd>{form.unit}</dd>
            <dt>Title</dt><dd>{form.title}</dd>
            <dt>File</dt><dd>{form.file?.name}</dd>
          </dl>
          <label className="check">
            <input type="checkbox" checked={form.declaration} onChange={(e) => update('declaration', e.target.checked)} />
            This is our own work and we have acknowledged all sources and AI tools.
          </label>
          {errors.declaration && <p className="error-text">{errors.declaration}</p>}
        </div>
      )}

      {step === 3 && (
        <div className="alert alert-success" role="status">
          <Check size={20} aria-hidden="true" />
          <span>Submitted! Your receipt number is <strong className="mono">{receipt}</strong>.</span>
        </div>
      )}

      <div className="row-between">
        {step > 0 && step < 3 ? (
          <button type="button" className="btn btn-ghost" onClick={() => goTo(step - 1)}>Back</button>
        ) : <span />}
        {step < 3 ? (
          <button type="submit" className="btn btn-primary">{step === 2 ? 'Submit assignment' : 'Next'}</button>
        ) : (
          <button type="button" className="btn" onClick={restart}>Submit another</button>
        )}
      </div>
    </form>
  );
}
