/**
 * PropsPlayground – props flow ONE way: parent → child.
 *
 * The parent (this component) owns the data in state. Every time you edit a
 * field, the parent re-renders and passes NEW props down to <StudentCard>.
 * The card itself never changes its props – it just displays them.
 */
import { useId, useState } from 'react';
import StudentCard from './StudentCard.jsx';

const ALL_SKILLS = ['React', 'JavaScript', 'Python', 'FastAPI', 'SQL', 'Figma'];

// A tiny child used to show that props are read-only.
function NameTag(props) {
  const [message, setMessage] = useState('');

  function tryToChangeProp() {
    try {
      props.name = 'Hacker'; // ❌ never do this – shown only to prove the point
      setMessage('No error (production build), but nothing re-rendered – React never noticed.');
    } catch (error) {
      // In development React freezes the props object, so assignment throws.
      setMessage(`${error.name}: ${error.message}`);
    }
  }

  return (
    <div className="stack-sm">
      <div className="row">
        <span className="badge badge-code">name = "{props.name}"</span>
        <button type="button" className="btn btn-sm btn-danger" onClick={tryToChangeProp}>
          Try props.name = 'Hacker'
        </button>
      </div>
      {message && <p className="error-text mono" role="status">{message}</p>}
    </div>
  );
}

export default function PropsPlayground() {
  const [name, setName] = useState('Minh Pham');
  const [major, setMajor] = useState('Artificial Intelligence');
  const [isOnline, setIsOnline] = useState(true);
  const [skills, setSkills] = useState(['Python']);
  const id = useId();

  function toggleSkill(skill) {
    setSkills((current) =>
      current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill],
    );
  }

  return (
    <div className="grid-2">
      <form className="stack" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label className="label" htmlFor={`${id}-name`}>name</label>
          <input id={`${id}-name`} className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${id}-major`}>major</label>
          <select id={`${id}-major`} className="input" value={major} onChange={(e) => setMajor(e.target.value)}>
            <option>Artificial Intelligence</option>
            <option>Cybersecurity</option>
            <option>Data Science</option>
            <option>Software Development</option>
          </select>
        </div>
        <fieldset>
          <legend>skills (an array prop)</legend>
          <div className="row">
            {ALL_SKILLS.map((skill) => (
              <label key={skill} className="check">
                <input type="checkbox" checked={skills.includes(skill)} onChange={() => toggleSkill(skill)} />
                {skill}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="switch">
          <input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} />
          <span className="switch-track" />
          isOnline
        </label>
      </form>

      <div className="stack">
        {/* The same values flow down as props. `|| '…'` guards against an empty name. */}
        <StudentCard name={name || 'Anonymous'} studentId="104607040" major={major} skills={skills} isOnline={isOnline} />
        <pre className="demo-output">
          {`<StudentCard\n  name="${name}"\n  major="${major}"\n  skills={${JSON.stringify(skills)}}\n  isOnline={${isOnline}}\n/>`}
        </pre>
        <NameTag name={name} />
      </div>
    </div>
  );
}
