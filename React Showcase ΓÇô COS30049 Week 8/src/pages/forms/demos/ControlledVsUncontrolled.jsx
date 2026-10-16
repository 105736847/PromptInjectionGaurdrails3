import { useId, useRef, useState } from 'react';

/**
 * Controlled vs uncontrolled inputs.
 *
 * UNCONTROLLED: the DOM keeps the value. You give a starting value with
 * defaultValue / defaultChecked and read it only when you need it –
 * with a ref, or all at once with new FormData(form) on submit.
 *
 * CONTROLLED: React state keeps the value (value + onChange). Every
 * keystroke goes through your code, so you can show it live, transform
 * it or validate it immediately.
 */
const CAMPUSES = ['Hawthorn', 'Croydon', 'Wantirna', 'Online'];
const INTERESTS = ['AI', 'Web', 'Cyber security'];

function UncontrolledForm() {
  const id = useId();
  const nameRef = useRef(null);
  const [refValue, setRefValue] = useState('');
  const [submitted, setSubmitted] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget); // reads every named field
    const data = Object.fromEntries(formData); // { name, campus, interests (only the first!) }
    data.interests = formData.getAll('interests'); // same name several times → getAll()
    setSubmitted(data);
  }

  return (
    <form className="stack-sm" onSubmit={handleSubmit}>
      <label className="label" htmlFor={`${id}-name`}>Name</label>
      <input id={`${id}-name`} ref={nameRef} name="name" className="input" defaultValue="Jordan Lee" />
      <label className="label" htmlFor={`${id}-campus`}>Campus</label>
      <select id={`${id}-campus`} name="campus" className="input" defaultValue="Hawthorn">
        {CAMPUSES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <div className="row">
        {INTERESTS.map((interest) => (
          <label key={interest} className="check small">
            <input type="checkbox" name="interests" value={interest} defaultChecked={interest === 'AI'} /> {interest}
          </label>
        ))}
      </div>
      <div className="row">
        <button type="button" className="btn btn-sm" onClick={() => setRefValue(nameRef.current.value)}>
          Read name via ref
        </button>
        <button type="submit" className="btn btn-sm btn-primary">Submit → FormData</button>
      </div>
      <pre className="demo-output">
        {`nameRef.current.value: ${JSON.stringify(refValue)}\n`}
        {`FormData: ${submitted ? JSON.stringify(submitted, null, 2) : '(submit the form)'}`}
      </pre>
    </form>
  );
}

function ControlledForm() {
  const id = useId();
  const [name, setName] = useState('Jordan Lee');
  const [studentId, setStudentId] = useState('');

  return (
    <div className="stack-sm">
      <label className="label" htmlFor={`${id}-name`}>Name</label>
      <input id={`${id}-name`} className="input" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="label" htmlFor={`${id}-sid`}>Student ID (digits only, max 9)</label>
      <input id={`${id}-sid`} className="input" inputMode="numeric" value={studentId} placeholder="Try typing letters"
        // Transform on every keystroke: strip non-digits and cut to 9 characters
        onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 9))} />
      <p className="m-0">
        Live preview: <strong>{name || '…'}</strong> ({studentId || 'no ID'}) – {name.length} characters
      </p>
      <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }}
        onClick={() => { setName(''); setStudentId(''); }}>
        Clear from code
      </button>
      <p className="hint">Because React owns the value, code can clear or change it at any time.</p>
    </div>
  );
}

export default function ControlledVsUncontrolled() {
  return (
    <div className="grid-2">
      <section className="card stack-sm">
        <h4 className="m-0">Uncontrolled – defaultValue + ref / FormData</h4>
        <UncontrolledForm />
      </section>
      <section className="card stack-sm">
        <h4 className="m-0">Controlled – value + onChange</h4>
        <ControlledForm />
      </section>
    </div>
  );
}
