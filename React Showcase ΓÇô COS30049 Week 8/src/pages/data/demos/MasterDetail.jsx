/**
 * MasterDetail – a list on the left ("master"), the selected item's details
 * on the right ("detail"). Mail apps, file explorers and admin dashboards all
 * use this pattern.
 *
 * Tip: store the selected ID, not a copy of the selected object. The object is
 * looked up from the list on every render, so it can never go stale.
 */
import { useState } from 'react';
import { CircleCheck, CircleAlert, Mail, MapPin, Search } from 'lucide-react';
import { students } from '../../../data/students.js';
import GradeBadge, { GRADE_NAMES } from './GradeBadge.jsx';

const cohortAverage = students.reduce((sum, s) => sum + s.score, 0) / students.length;
const byScore = [...students].sort((a, b) => b.score - a.score);

function ScoreMeter({ score }) {
  const passed = score >= 50;
  return (
    <div className="stack-sm">
      <div className="row-between small">
        <span>Score</span>
        <strong>{score} / 100</strong>
      </div>
      {/* role="meter" tells assistive technology this is a measurement */}
      <div
        className="data-meter"
        role="meter"
        aria-label="Score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        style={{ '--meter-color': passed ? 'var(--color-success)' : 'var(--color-danger)' }}
      >
        <span className="data-meter-fill" style={{ width: `${score}%` }} />
        <span className="data-meter-mark" style={{ left: '50%' }} title="Pass mark" />
      </div>
      <p className="m-0 small row">
        {/* Colour plus an icon and words – never colour alone */}
        {passed ? <CircleCheck size={16} aria-hidden="true" /> : <CircleAlert size={16} aria-hidden="true" />}
        {passed ? 'Passed' : 'Below the pass mark (50)'}
      </p>
    </div>
  );
}

export default function MasterDetail() {
  const [selectedId, setSelectedId] = useState(students[0].id);
  const [query, setQuery] = useState('');

  const visible = students.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const selected = students.find((s) => s.id === selectedId); // derived, not stored
  const rank = byScore.findIndex((s) => s.id === selectedId) + 1;
  const difference = selected.score - cohortAverage;

  return (
    <div className="data-md">
      <div className="data-md-master">
        <div className="data-search">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            type="search"
            aria-label="Filter the student list"
            placeholder="Filter by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ul className="data-md-list" aria-label="Students">
          {visible.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="data-md-item"
                aria-current={s.id === selectedId ? 'true' : undefined}
                onClick={() => setSelectedId(s.id)}
              >
                <span>
                  {s.firstName} {s.lastName}
                </span>
                <GradeBadge grade={s.grade} />
              </button>
            </li>
          ))}
          {visible.length === 0 && <li className="small muted data-md-empty">No names match “{query}”.</li>}
        </ul>
      </div>

      <article className="data-md-detail" aria-label="Student details">
        <header className="row">
          <span className="avatar" aria-hidden="true">
            {selected.firstName[0]}
            {selected.lastName[0]}
          </span>
          <div>
            <h4 className="m-0">
              {selected.firstName} {selected.lastName}
            </h4>
            <span className="small muted mono">{selected.studentId}</span>
          </div>
        </header>

        <dl className="data-md-facts">
          <dt>Major</dt>
          <dd>{selected.major}</dd>
          <dt>Campus</dt>
          <dd className="row">
            <MapPin size={14} aria-hidden="true" /> {selected.campus}
          </dd>
          <dt>Year</dt>
          <dd>Year {selected.year}</dd>
          <dt>Enrolled</dt>
          <dd>
            {/* "YYYY-MM-DD" strings are parsed as UTC midnight, so format them in UTC too */}
            <time dateTime={selected.enrolled}>
              {new Date(selected.enrolled).toLocaleDateString('en-AU', { timeZone: 'UTC' })}
            </time>
          </dd>
          <dt>Grade</dt>
          <dd className="row">
            <GradeBadge grade={selected.grade} /> {GRADE_NAMES[selected.grade]}
          </dd>
          <dt>Status</dt>
          <dd>
            <span className={`badge ${selected.status === 'At risk' ? 'badge-warning' : 'badge-success'}`}>
              {selected.status}
            </span>
          </dd>
        </dl>

        <ScoreMeter score={selected.score} />
        <p className="m-0 small muted">
          Ranked #{rank} of {students.length} · {Math.abs(difference).toFixed(1)} points{' '}
          {difference >= 0 ? 'above' : 'below'} the cohort average ({cohortAverage.toFixed(1)}).
        </p>

        <a className="btn btn-sm" href={`mailto:${selected.email}`}>
          <Mail size={15} /> Email {selected.firstName}
        </a>
      </article>
    </div>
  );
}
