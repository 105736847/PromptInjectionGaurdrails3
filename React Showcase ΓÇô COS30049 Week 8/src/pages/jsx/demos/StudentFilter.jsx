/**
 * StudentFilter – rendering lists with filter() + map().
 *
 *   array.filter(keep?)   → a shorter array (the rows you want)
 *   array.map(toJSX)      → an array of elements React can render
 *
 * Every element in a list needs a `key` that is unique among its siblings and
 * stable over time – a database id is perfect. The filtered list is NOT stored
 * in state: it is calculated from the real data on every render.
 */
import { useId, useState } from 'react';
import { students, MAJORS } from '../../../data/students.js';

export default function StudentFilter() {
  const [query, setQuery] = useState('');
  const [major, setMajor] = useState('All');
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const id = useId();

  // Derived data: filter the full list using the current state.
  const visible = students
    .filter((s) => major === 'All' || s.major === major)
    .filter((s) => !atRiskOnly || s.status === 'At risk')
    .filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="stack">
      <div className="jsx-filter-bar">
        <div className="field">
          <label className="label" htmlFor={`${id}-q`}>Search by name</label>
          <input id={`${id}-q`} className="input" type="search" placeholder="e.g. Nguyen"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${id}-major`}>Major</label>
          <select id={`${id}-major`} className="input" value={major} onChange={(e) => setMajor(e.target.value)}>
            <option value="All">All majors</option>
            {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <label className="check">
          <input type="checkbox" checked={atRiskOnly} onChange={(e) => setAtRiskOnly(e.target.checked)} />
          At risk only
        </label>
      </div>

      <p className="small muted m-0" aria-live="polite">
        Showing {visible.length} of {students.length} students
      </p>

      {visible.length === 0 ? (
        <p className="alert alert-info m-0">No students match your filters.</p>
      ) : (
        <ul className="jsx-student-rows">
          {visible.map((s) => (
            // key = the student's id: unique AND stays the same when the list changes
            <li key={s.id} className="jsx-student-row">
              <span className="avatar" aria-hidden="true">{s.firstName[0]}{s.lastName[0]}</span>
              <span className="jsx-student-row-name">
                <strong>{s.firstName} {s.lastName}</strong>
                <span className="small muted">{s.major} · Year {s.year}</span>
              </span>
              <span className={`badge ${s.status === 'At risk' ? 'badge-danger' : 'badge-success'}`}>{s.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
