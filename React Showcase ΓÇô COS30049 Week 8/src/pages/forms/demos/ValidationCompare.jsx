import { useId, useState } from 'react';
import styles from './ValidationCompare.module.css';

/**
 * The same three rules, validated two ways.
 *
 * LEFT – HTML5 native validation: attributes (required, minLength, pattern,
 * min/max, type="email") + CSS :user-invalid. Zero JS rules; the browser
 * blocks the submit and shows its own bubbles. We read `validationMessage`.
 *
 * RIGHT – custom JS validation: noValidate + our own validate() function.
 * More code, but full control over wording, timing and styling.
 */
function NativeForm() {
  const id = useId();
  const [eager, setEager] = useState(false);
  const [messages, setMessages] = useState({});
  const [status, setStatus] = useState('');

  // onChange on the FORM receives change events from every input inside it (event bubbling).
  function handleChange(event) {
    const { name, validationMessage } = event.target;
    setMessages((prev) => ({ ...prev, [name]: validationMessage }));
    setStatus('');
  }

  return (
    // "invalid" events don't bubble, but React's capture phase (onInvalidCapture) still sees them.
    // They fire for every invalid field when the user tries to submit.
    <form className={`stack-sm ${styles.native} ${eager ? styles.eager : ''}`} onChange={handleChange}
      onInvalidCapture={handleChange}
      onSubmit={(e) => { e.preventDefault(); setStatus('✓ The browser found no problems – submitted.'); }}>
      <label className="label" htmlFor={`${id}-user`}>Username</label>
      <input id={`${id}-user`} name="username" className="input" required minLength={3} pattern="[a-z0-9_]+"
        title="Lowercase letters, numbers and _ only" placeholder="min 3, a-z 0-9 _" />
      <label className="label" htmlFor={`${id}-email`}>Email</label>
      <input id={`${id}-email`} name="email" type="email" className="input" required />
      <label className="label" htmlFor={`${id}-size`}>Team size</label>
      <input id={`${id}-size`} name="teamSize" type="number" className="input" required min={3} max={4} />

      <label className="check small">
        <input type="checkbox" checked={eager} onChange={(e) => { e.stopPropagation(); setEager(e.target.checked); }} />
        Style with :invalid (red before typing!)
      </label>
      <button type="submit" className="btn btn-primary">Submit (native)</button>
      {status && <p className="small m-0" style={{ color: 'var(--color-success)' }}>{status}</p>}

      <ul className={styles.messages}>
        {['username', 'email', 'teamSize'].map((name) => (
          <li key={name}>
            <code>{name}.validationMessage</code>: {name in messages ? messages[name] || '✓ valid' : '—'}
          </li>
        ))}
      </ul>
    </form>
  );
}

function validate({ username, email, teamSize }) {
  const errors = {};
  if (!username) errors.username = 'Pick a username.';
  else if (username.length < 3) errors.username = `Almost! ${3 - username.length} more character(s).`;
  else if (!/^[a-z0-9_]+$/.test(username)) errors.username = 'Only lowercase letters, numbers and _ please.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'That email doesn’t look right.';
  if (teamSize === '') errors.teamSize = 'How many people are in your team?';
  else if (Number(teamSize) < 3 || Number(teamSize) > 4) errors.teamSize = 'Assignment teams have 3 or 4 members.';
  return errors;
}

function CustomForm() {
  const id = useId();
  const [values, setValues] = useState({ username: '', email: '', teamSize: '' });
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('');
  const errors = validate(values);

  const change = (e) => { setValues({ ...values, [e.target.name]: e.target.value }); setStatus(''); };
  const blur = (e) => setTouched({ ...touched, [e.target.name]: true });
  const show = (name) => touched[name] && errors[name];

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ username: true, email: true, teamSize: true });
    setStatus(Object.keys(errors).length ? '' : '✓ Our validate() found no problems – submitted.');
  }

  const fields = [
    { name: 'username', label: 'Username', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'teamSize', label: 'Team size', type: 'number' },
  ];

  return (
    <form className="stack-sm" onSubmit={handleSubmit} noValidate>
      {fields.map((f) => (
        <div key={f.name} className="stack-sm">
          <label className="label" htmlFor={`${id}-${f.name}`}>{f.label}</label>
          <input id={`${id}-${f.name}`} name={f.name} type={f.type} value={values[f.name]} onChange={change} onBlur={blur}
            className={`input ${show(f.name) ? 'is-invalid' : touched[f.name] ? 'is-valid' : ''}`}
            aria-invalid={Boolean(show(f.name))} aria-describedby={`${id}-${f.name}-err`} />
          <p id={`${id}-${f.name}-err`} className="error-text">{show(f.name)}</p>
        </div>
      ))}
      <button type="submit" className="btn btn-primary">Submit (custom)</button>
      {status && <p className="small m-0" style={{ color: 'var(--color-success)' }}>{status}</p>}
    </form>
  );
}

export default function ValidationCompare() {
  return (
    <div className="grid-2">
      <section className="card stack-sm">
        <h4 className="m-0">HTML5 native validation</h4>
        <NativeForm />
      </section>
      <section className="card stack-sm">
        <h4 className="m-0">Custom JavaScript validation</h4>
        <CustomForm />
      </section>
    </div>
  );
}
