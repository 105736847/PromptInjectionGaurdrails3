import { useId, useState } from 'react';
import { Check, Lock } from 'lucide-react';
import './ConditionalClassNames.css';

/**
 * ConditionalClassNames – picking CSS classes from state.
 *
 * `className` is just a string, so any JavaScript that builds a string works:
 *   1. a template literal:  `pill pill-${status}`
 *   2. a tiny helper:       cx('unit', isSelected && 'is-selected')
 * cx() is a one-line version of the popular "clsx" / "classnames" packages.
 */

// Keep the truthy arguments, drop false / null / undefined / '' and join with spaces.
function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

const STATUSES = ['active', 'at-risk', 'withdrawn', 'graduated'];

const UNITS = [
  { code: 'COS30049', name: 'Innovation Project' },
  { code: 'COS30043', name: 'Interface Design' },
  { code: 'COS20019', name: 'Cloud Computing', full: true },
  { code: 'COS30045', name: 'Data Visualisation' },
];

export default function ConditionalClassNames() {
  const [status, setStatus] = useState('active');
  const [compact, setCompact] = useState(false);
  const [selected, setSelected] = useState(['COS30049']);
  const selectId = useId();

  // 1. Template literal – easy, but look at the output: a stray space when compact is false.
  const templateClass = `styling-pill styling-pill-${status} ${compact ? 'is-compact' : ''}`;
  // 2. cx() – falsy values simply disappear.
  const cxClass = cx('styling-pill', `styling-pill-${status}`, compact && 'is-compact');

  function toggleUnit(code) {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  return (
    <div className="stack-lg">
      <div className="grid-2">
        <div className="stack">
          <div className="field">
            <label className="label" htmlFor={selectId}>Enrolment status</label>
            <select id={selectId} className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <label className="check">
            <input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} />
            Compact pill
          </label>
        </div>
        <div className="stack">
          <span className={cxClass}>{status.replace('-', ' ')}</span>
          <pre className="demo-output m-0">
            {`template literal → "${templateClass}"\ncx()             → "${cxClass}"`}
          </pre>
        </div>
      </div>

      <div>
        <p className="small muted mb-1">
          Pick your units – each card’s className is built with <code>cx()</code> ({selected.length} selected):
        </p>
        <div className="styling-units">
          {UNITS.map((unit) => {
            const isSelected = selected.includes(unit.code);
            const className = cx('styling-unit', isSelected && 'is-selected', unit.full && 'is-full');
            return (
              <button
                key={unit.code}
                type="button"
                className={className}
                aria-pressed={isSelected}
                disabled={unit.full}
                onClick={() => toggleUnit(unit.code)}
              >
                <span className="styling-unit-icon" aria-hidden="true">
                  {unit.full ? <Lock size={14} /> : <Check size={14} />}
                </span>
                <strong className="mono">{unit.code}</strong>
                <span className="small">{unit.full ? 'Class full' : unit.name}</span>
                <code className="styling-unit-class">{className}</code>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
