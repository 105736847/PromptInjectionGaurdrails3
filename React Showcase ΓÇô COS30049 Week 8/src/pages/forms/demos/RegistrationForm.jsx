import { useId, useRef, useState } from 'react';
import { Eye, EyeOff, RotateCcw, Send, CircleAlert } from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import {
  INITIAL_VALUES, UNITS, ROLES, SKILLS, BIO_MAX,
  today, getPasswordStrength, validate, fakeRegister,
} from './registration.js';
import styles from './RegistrationForm.module.css';

/**
 * A complete, realistic form – the pattern you will reuse in Assignment 3.
 *
 * 1. ONE state object holds every field; ONE handleChange updates any of them
 *    using event.target.name (so each input needs a `name`).
 * 2. Errors are DERIVED from the values on every render (no extra state),
 *    but only SHOWN once a field was "touched" (blurred) or the form submitted.
 * 3. On submit: show all errors and focus the first invalid field, otherwise
 *    call the (fake) API while the button shows a spinner.
 */

// Small layout helper: label + control + hint/error message.
function Field({ id, label, required, hint, error, className = '', children }) {
  return (
    <div className={`field ${className}`}>
      <label className="label" htmlFor={id}>
        {label} {required && <span className="required" aria-hidden="true">*</span>}
      </label>
      {children}
      <p id={`${id}-msg`} className={error ? 'error-text' : 'hint'}>{error ?? hint}</p>
    </div>
  );
}

export default function RegistrationForm() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [result, setResult] = useState(null);
  const formRef = useRef(null);
  const fileRef = useRef(null);
  const uid = useId();
  const { showToast } = useToast();

  const errors = validate(values); // derived every render – always up to date
  const strength = getPasswordStrength(values.password);
  const idFor = (name) => `${uid}-${name}`;
  const errorFor = (name) => (touched[name] ? errors[name] : undefined);

  // ONE handler for every input type.
  function handleChange(event) {
    const { name, type, value, checked, files } = event.target;
    setValues((prev) => {
      if (type === 'checkbox' && Array.isArray(prev[name])) {
        // Checkbox GROUP → add or remove this value from the array
        const list = checked ? [...prev[name], value] : prev[name].filter((v) => v !== value);
        return { ...prev, [name]: list };
      }
      if (type === 'checkbox') return { ...prev, [name]: checked };
      if (type === 'file') return { ...prev, [name]: files[0] ?? null };
      return { ...prev, [name]: value }; // text, email, select, radio, range, color…
    });
  }

  function handleBlur(event) {
    setTouched((prev) => ({ ...prev, [event.target.name]: true }));
  }

  // The props every simple input shares: value, handlers and a11y wiring.
  function inputProps(name) {
    return {
      id: idFor(name),
      name,
      value: values[name],
      onChange: handleChange,
      onBlur: handleBlur,
      className: 'input',
      'aria-invalid': Boolean(errorFor(name)),
      'aria-describedby': `${idFor(name)}-msg`,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    setServerError(null);
    setTouched(Object.fromEntries(Object.keys(INITIAL_VALUES).map((key) => [key, true])));

    const invalidFields = Object.keys(errors);
    if (invalidFields.length > 0) {
      // form.elements.namedItem() finds a control by name. Radio/checkbox groups
      // share a name, so we get a RadioNodeList → focus its first control.
      const element = formRef.current.elements.namedItem(invalidFields[0]);
      (element instanceof RadioNodeList ? element[0] : element)?.focus();
      showToast({ type: 'error', title: 'Please check the form', message: `${invalidFields.length} field(s) need attention.` });
      return;
    }

    setSubmitting(true);
    try {
      const { id } = await fakeRegister(values);
      const { avatar, password, ...rest } = values;
      setResult({
        id,
        ...rest,
        age: Number(values.age), // convert strings to the types the API expects
        hours: Number(values.hours),
        password: '•'.repeat(password.length), // never display a real password
        avatar: avatar && { name: avatar.name, size: avatar.size, type: avatar.type },
      });
      showToast({ type: 'success', title: 'Team registered', message: `Welcome aboard, ${values.fullName}!` });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false); // runs after success AND failure
    }
  }

  function handleReset() {
    setValues(INITIAL_VALUES);
    setTouched({});
    setResult(null);
    setServerError(null);
    // File inputs cannot be controlled (their value is read-only), so clear the DOM node directly.
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="stack-lg">
      {/* noValidate turns off the browser's own error bubbles – we show our own messages */}
      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate aria-describedby={`${uid}-intro`}>
        <p id={`${uid}-intro`} className="small muted">
          Fields marked <span className="required">*</span> are required.
          Tip: use <code>taken@example.com</code> to see a server error.
        </p>

        {/* A disabled <fieldset> disables every control inside it – perfect while submitting. */}
        <fieldset className={styles.plain} disabled={submitting}>
          <div className={styles.grid}>
            <Field id={idFor('fullName')} label="Full name" required hint="As it appears on your student card." error={errorFor('fullName')}>
              <input type="text" autoComplete="name" required {...inputProps('fullName')} />
            </Field>

            <Field id={idFor('email')} label="Student email" required hint="We send the confirmation here." error={errorFor('email')}>
              <input type="email" autoComplete="email" required {...inputProps('email')} placeholder="alex@student.example.edu.au" />
            </Field>

            <Field id={idFor('password')} label="Password" required error={errorFor('password')}
              hint="8+ characters, upper & lower case and a number.">
              <div className={styles.passwordWrap}>
                <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required {...inputProps('password')} />
                <button type="button" className={`btn-icon ${styles.eye}`} onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="row small" style={{ gap: 8 }}>
                <meter min="0" max="4" low="2" high="3" optimum="4" value={strength.score} className={styles.meter} aria-label="Password strength" />
                <span className="muted">{values.password ? strength.label : 'Strength'}</span>
              </div>
            </Field>

            <Field id={idFor('phone')} label="Mobile" hint="Optional." error={errorFor('phone')}>
              <input type="tel" autoComplete="tel" {...inputProps('phone')} placeholder="+61 412 345 678" />
            </Field>

            <Field id={idFor('portfolio')} label="GitHub / portfolio URL" hint="Optional." error={errorFor('portfolio')}>
              <input type="url" {...inputProps('portfolio')} placeholder="https://github.com/your-name" />
            </Field>

            <Field id={idFor('age')} label="Age" required hint="16–99." error={errorFor('age')}>
              <input type="number" min="16" max="99" step="1" inputMode="numeric" required {...inputProps('age')} />
            </Field>

            <Field id={idFor('startDate')} label="Project start date" required hint="Today or later." error={errorFor('startDate')}>
              <input type="date" min={today()} required {...inputProps('startDate')} />
            </Field>

            <Field id={idFor('meetingTime')} label="Weekly meeting time" hint="Optional, 08:00–20:00." error={errorFor('meetingTime')}>
              <input type="time" min="08:00" max="20:00" {...inputProps('meetingTime')} />
            </Field>

            <Field id={idFor('unit')} label="Unit" required error={errorFor('unit')} className={styles.full}>
              <select required {...inputProps('unit')}>
                <option value="" disabled>Choose a unit…</option>
                {UNITS.map((u) => (
                  <option key={u.code} value={u.code}>{u.code} – {u.name}</option>
                ))}
              </select>
            </Field>

            {/* Radio group: same name, different values; checked compares with state */}
            <fieldset className={styles.full} aria-describedby={`${idFor('role')}-msg`}>
              <legend>Preferred role <span className="required" aria-hidden="true">*</span></legend>
              <div className="row">
                {ROLES.map((role) => (
                  <label key={role} className="check">
                    <input type="radio" name="role" value={role} checked={values.role === role} onChange={handleChange} onBlur={handleBlur} />
                    {role}
                  </label>
                ))}
              </div>
              <p id={`${idFor('role')}-msg`} className="error-text mt-1">{errorFor('role')}</p>
            </fieldset>

            {/* Checkbox group: the value is an ARRAY in state */}
            <fieldset className={styles.full} aria-describedby={`${idFor('skills')}-msg`}>
              <legend>Skills <span className="required" aria-hidden="true">*</span> ({values.skills.length} selected)</legend>
              <div className="row">
                {SKILLS.map((skill) => (
                  <label key={skill} className="check">
                    <input type="checkbox" name="skills" value={skill} checked={values.skills.includes(skill)} onChange={handleChange} onBlur={handleBlur} />
                    {skill}
                  </label>
                ))}
              </div>
              <p id={`${idFor('skills')}-msg`} className="error-text mt-1">{errorFor('skills')}</p>
            </fieldset>

            <Field id={idFor('hours')} label={`Hours per week you can commit: ${values.hours}`} hint="Drag the slider.">
              <input type="range" min="1" max="20" id={idFor('hours')} name="hours" value={values.hours} onChange={handleChange} />
            </Field>

            <Field id={idFor('teamColour')} label="Team colour" hint={`Selected: ${values.teamColour}`}>
              <div className="row">
                <input type="color" {...inputProps('teamColour')} />
                <span className={styles.swatch} style={{ background: values.teamColour }} aria-hidden="true" />
              </div>
            </Field>

            <Field id={idFor('bio')} label="Short bio" className={styles.full} error={errorFor('bio')}
              hint={`${values.bio.length} / ${BIO_MAX} characters`}>
              <textarea rows={3} maxLength={BIO_MAX} {...inputProps('bio')} placeholder="What do you bring to the team?" />
            </Field>

            <Field id={idFor('avatar')} label="Avatar image" hint="Optional. PNG or JPG under 1 MB." error={errorFor('avatar')}>
              {/* No value prop: file inputs are always uncontrolled. We keep a ref to clear it. */}
              <input ref={fileRef} type="file" accept="image/*" id={idFor('avatar')} name="avatar" className="input"
                onChange={handleChange} onBlur={handleBlur} aria-invalid={Boolean(errorFor('avatar'))} aria-describedby={`${idFor('avatar')}-msg`} />
            </Field>

            <div className={`field ${styles.full}`}>
              <label className="check">
                <input type="checkbox" name="agree" checked={values.agree} onChange={handleChange} onBlur={handleBlur}
                  aria-invalid={Boolean(errorFor('agree'))} aria-describedby={`${idFor('agree')}-msg`} />
                I have read and accept the team charter <span className="required" aria-hidden="true">*</span>
              </label>
              <p id={`${idFor('agree')}-msg`} className="error-text">{errorFor('agree')}</p>
            </div>
          </div>
        </fieldset>

        {serverError && (
          <div className="alert alert-danger mt-2" role="alert">
            <CircleAlert size={18} aria-hidden="true" /> {serverError}
          </div>
        )}

        <div className="row mt-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className={styles.btnSpinner} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            {submitting ? 'Registering…' : 'Register team'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleReset} disabled={submitting}>
            <RotateCcw size={16} aria-hidden="true" /> Reset
          </button>
        </div>
      </form>

      {result && (
        <div className="stack-sm">
          <strong>Data sent to the server (as JSON):</strong>
          <pre className="demo-output">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
