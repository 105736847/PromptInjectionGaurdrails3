/**
 * UnitPicker – child → parent communication with FUNCTION props.
 *
 * Data only flows down in React. So how does a child tell its parent that
 * something happened? The parent passes a function down as a prop
 * (onSelect, onToggleEnrol) and the child CALLS it. The state stays in the parent.
 */
import { useState } from 'react';
import { Check, Plus } from 'lucide-react';

const UNITS = [
  { code: 'COS30049', name: 'Computing Technology Innovation Project', credits: 12.5, day: 'Mon' },
  { code: 'COS30045', name: 'Data Visualisation', credits: 12.5, day: 'Tue' },
  { code: 'COS30019', name: 'Introduction to Artificial Intelligence', credits: 12.5, day: 'Wed' },
  { code: 'SWE30003', name: 'Software Architectures and Design', credits: 12.5, day: 'Thu' },
  { code: 'COS30043', name: 'Interface Design and Development', credits: 12.5, day: 'Fri' },
];
const MAX_UNITS = 4;

// CHILD: knows nothing about the parent's state. It only receives data + callbacks.
function UnitCard({ unit, isSelected, isEnrolled, onSelect, onToggleEnrol }) {
  return (
    <li className={`jsx-unit ${isSelected ? 'is-selected' : ''}`}>
      <button type="button" className="jsx-unit-main" onClick={() => onSelect(unit.code)} aria-pressed={isSelected}>
        <span className="mono small">{unit.code}</span>
        <span>{unit.name}</span>
      </button>
      <button
        type="button"
        className={`btn btn-sm ${isEnrolled ? 'btn-success' : ''}`}
        onClick={() => onToggleEnrol(unit.code)} // "Hey parent, toggle this one!"
        aria-label={`${isEnrolled ? 'Drop' : 'Enrol in'} ${unit.code}`}
      >
        {isEnrolled ? <Check size={14} /> : <Plus size={14} />}
        {isEnrolled ? 'Enrolled' : 'Enrol'}
      </button>
    </li>
  );
}

// PARENT: owns the state and decides what happens when a child calls back.
export default function UnitPicker() {
  const [selectedCode, setSelectedCode] = useState('COS30049');
  const [enrolled, setEnrolled] = useState(['COS30049']);
  const [lastCall, setLastCall] = useState('');

  function handleSelect(code) {
    setSelectedCode(code);
    setLastCall(`UnitCard called onSelect('${code}')`);
  }

  function handleToggleEnrol(code) {
    setLastCall(`UnitCard called onToggleEnrol('${code}')`);
    if (enrolled.includes(code)) {
      setEnrolled(enrolled.filter((c) => c !== code));
    } else if (enrolled.length < MAX_UNITS) {
      setEnrolled([...enrolled, code]);
    }
  }

  const selected = UNITS.find((unit) => unit.code === selectedCode);
  const totalCredits = enrolled.length * 12.5;

  return (
    <div className="grid-2">
      <ul className="jsx-unit-list">
        {UNITS.map((unit) => (
          <UnitCard
            key={unit.code}
            unit={unit}
            isSelected={unit.code === selectedCode}
            isEnrolled={enrolled.includes(unit.code)}
            onSelect={handleSelect} // pass the function itself – don't call it here!
            onToggleEnrol={handleToggleEnrol}
          />
        ))}
      </ul>

      <aside className="stack">
        <div className="card card-subtle">
          <p className="small muted m-0">Selected unit (state in parent)</p>
          <h4 className="m-0">{selected.code}</h4>
          <p className="m-0">{selected.name}</p>
          <p className="small muted m-0">{selected.credits} credit points · classes on {selected.day}</p>
        </div>
        <p className="m-0">
          Enrolled in <strong>{enrolled.length}</strong> / {MAX_UNITS} units ({totalCredits} credit points)
        </p>
        {enrolled.length === MAX_UNITS && (
          <p className="alert alert-warning m-0">Maximum study load reached – drop a unit first.</p>
        )}
        <pre className="demo-output" aria-live="polite">{lastCall || 'Click a unit or an Enrol button…'}</pre>
      </aside>
    </div>
  );
}
