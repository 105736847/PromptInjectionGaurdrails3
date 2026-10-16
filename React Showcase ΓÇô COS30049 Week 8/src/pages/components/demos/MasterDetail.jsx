/**
 * MasterDetail – pick an item in a list (master), see its details (detail).
 *
 * - We store only the selected ID. The selected student object is looked up
 *   during render, so it can never get out of sync with the list.
 * - ↑ / ↓ move the selection while the list has focus.
 * - Responsive: on a narrow container only one pane is shown at a time and
 *   a "Back" button returns to the list (see the CSS container query).
 */
import { useState } from 'react';
import { ArrowLeft, Mail, MapPin, Search } from 'lucide-react';
import { students } from '../../../data/students.js';
import styles from './MasterDetail.module.css';

const GRADE_BADGE = { HD: 'badge-success', D: 'badge-info', C: 'badge-primary', P: 'badge-warning', N: 'badge-danger' };

export default function MasterDetail() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(students[0].id);
  const [mobilePane, setMobilePane] = useState('list'); // which pane a narrow screen shows

  const filtered = students.filter((s) => `${s.firstName} ${s.lastName} ${s.major}`.toLowerCase().includes(query.toLowerCase()));
  const selected = students.find((s) => s.id === selectedId);

  function choose(id) {
    setSelectedId(id);
    setMobilePane('detail');
  }

  function handleListKeyDown(event) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const index = filtered.findIndex((s) => s.id === selectedId);
    const next = filtered[index + (event.key === 'ArrowDown' ? 1 : -1)];
    if (next) {
      setSelectedId(next.id);
      // event.currentTarget is the <ul>; find the button for the next student inside it
      event.currentTarget.querySelector(`[data-id="${next.id}"]`)?.focus();
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.layout} data-pane={mobilePane}>
        <div className={styles.master}>
          <div className={styles.search}>
            <Search size={16} aria-hidden="true" />
            <input className="input" type="search" placeholder="Search students…" aria-label="Search students" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <ul className={styles.list} aria-label="Students" onKeyDown={handleListKeyDown}>
            {filtered.map((s) => (
              <li key={s.id}>
                <button data-id={s.id} type="button" className={styles.row} aria-current={s.id === selectedId ? 'true' : undefined} onClick={() => choose(s.id)}>
                  <span className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }} aria-hidden="true">{s.firstName[0]}{s.lastName[0]}</span>
                  <span className={styles.rowText}>
                    <strong>{s.firstName} {s.lastName}</strong>
                    <span className="small muted">{s.major}</span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="small muted" style={{ padding: 12 }}>No students match “{query}”.</li>}
          </ul>
        </div>

        <article className={styles.detail}>
          <button type="button" className={`btn btn-ghost btn-sm ${styles.back}`} onClick={() => setMobilePane('list')}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to list
          </button>
          {selected && (
            <>
              <header className={styles.detailHeader}>
                <span className="avatar" style={{ width: 56, height: 56, fontSize: '1.1rem' }} aria-hidden="true">{selected.firstName[0]}{selected.lastName[0]}</span>
                <div>
                  <h4 className="m-0">{selected.firstName} {selected.lastName}</h4>
                  <span className="small muted mono">{selected.studentId}</span>
                </div>
                <span className={`badge ${selected.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{selected.status}</span>
              </header>
              <dl className={styles.facts}>
                <dt>Major</dt><dd>{selected.major}</dd>
                <dt>Year</dt><dd>{selected.year}</dd>
                <dt><MapPin size={14} aria-hidden="true" /> Campus</dt><dd>{selected.campus}</dd>
                <dt><Mail size={14} aria-hidden="true" /> Email</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd>
                <dt>Score</dt>
                <dd className={styles.score}>
                  <meter min={0} max={100} low={50} high={80} optimum={90} value={selected.score} aria-label="Score" />
                  {selected.score}/100 <span className={`badge ${GRADE_BADGE[selected.grade]}`}>{selected.grade}</span>
                </dd>
              </dl>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
