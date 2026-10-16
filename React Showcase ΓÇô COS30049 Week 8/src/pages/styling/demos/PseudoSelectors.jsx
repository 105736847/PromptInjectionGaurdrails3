import { useId, useState } from 'react';
import { Search } from 'lucide-react';
import { students } from '../../../data/students.js';
import './PseudoSelectors.css';

/**
 * PseudoSelectors – CSS reacts to the element's STATE and POSITION by itself.
 *   pseudo-classes  (:hover, :focus-visible, :checked, :nth-child() …) = a state
 *   pseudo-elements (::before, ::after, ::placeholder …)               = a part
 * Most of this demo needs no React state at all – the CSS file does the work.
 * Inline styles can't do any of this, which is a big reason to use CSS files.
 */
const STACK = ['React', 'FastAPI', 'scikit-learn', 'Docker', 'PostgreSQL'];
const PATTERNS = ['odd', 'even', '3n', '3n+1', '-n+3'];

export default function PseudoSelectors() {
  const [disabled, setDisabled] = useState(false);
  const [picked, setPicked] = useState(['React', 'FastAPI']);
  const [pattern, setPattern] = useState('odd');
  const id = useId();

  function togglePick(name) {
    setPicked((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  return (
    <div className="styling-pc-grid">
      <section className="styling-pc-tile">
        <h4>:hover · :active · :focus-visible · :disabled</h4>
        <button type="button" className="styling-pc-button" disabled={disabled}>
          Hover, press or Tab to me
        </button>
        <label className="check">
          <input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} />
          disabled
        </label>
        <p className="hint">The focus ring only appears for keyboard users (Tab), not for mouse clicks.</p>
      </section>

      <section className="styling-pc-tile">
        <h4>:checked + label</h4>
        <div className="styling-pc-chips">
          {STACK.map((name) => (
            <span key={name}>
              {/* The input is hidden; the label right after it gets styled with input:checked + label */}
              <input
                id={`${id}-${name}`}
                type="checkbox"
                className="styling-pc-chip-input"
                checked={picked.includes(name)}
                onChange={() => togglePick(name)}
              />
              <label htmlFor={`${id}-${name}`} className="styling-pc-chip">{name}</label>
            </span>
          ))}
        </div>
        <p className="hint">Your stack: {picked.join(', ') || 'nothing yet'}</p>
      </section>

      <section className="styling-pc-tile">
        <h4>:has() – a parent that reacts to its child</h4>
        <label className="styling-pc-agree">
          <input type="checkbox" />
          <span>I have read the academic integrity policy.</span>
        </label>
        <p className="hint">No React state here: <code>.card:has(input:checked)</code> does it all.</p>
      </section>

      <section className="styling-pc-tile">
        <h4>:nth-child()</h4>
        <div className="btn-group" role="group" aria-label="nth-child formula">
          {PATTERNS.map((p) => (
            <button
              key={p}
              type="button"
              className={`btn btn-sm mono ${pattern === p ? 'active' : ''}`}
              aria-pressed={pattern === p}
              onClick={() => setPattern(p)}
            >
              {p}
            </button>
          ))}
        </div>
        {/* React only switches a data attribute; CSS picks which rows to highlight */}
        <ol className="styling-pc-list" data-pattern={pattern}>
          {students.slice(0, 8).map((student) => (
            <li key={student.id}>{student.firstName} {student.lastName}</li>
          ))}
        </ol>
      </section>

      <section className="styling-pc-tile">
        <h4>::before · ::after</h4>
        <span className="styling-pc-required">Project title</span>
        <a className="styling-pc-external" href="https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements" target="_blank" rel="noreferrer">
          MDN: pseudo-elements
        </a>
        <blockquote className="styling-pc-quote">Commit early, commit often – and write good messages.</blockquote>
        <button type="button" className="btn btn-sm styling-pc-tip" data-tip="Tooltip made with ::after + attr()">
          Hover for a tooltip
        </button>
      </section>

      <section className="styling-pc-tile">
        <h4>::placeholder · :focus-within · :placeholder-shown</h4>
        <div className="styling-pc-search">
          <Search size={16} aria-hidden="true" />
          <input type="text" aria-label="Search units" placeholder="Search units…" />
          <kbd className="styling-pc-enter">Enter ↵</kbd>
        </div>
        <p className="hint">The box glows while the input inside is focused; the Enter hint only shows once you type.</p>
      </section>
    </div>
  );
}
