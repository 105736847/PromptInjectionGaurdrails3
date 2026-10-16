/**
 * StudentDirectory – the index route ("/routing").
 *
 * useSearchParams: the filter lives in the URL (?major=…&q=…) instead of in
 * useState, so the filtered view can be bookmarked, shared and survives a
 * refresh. Watch the address bar while you type.
 * useNavigate: change the URL from code – after a click or a form submit.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shuffle } from 'lucide-react';
import { students, MAJORS } from '../../../data/students.js';

export default function StudentDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read the filters from the URL ('' when missing).
  const major = searchParams.get('major') ?? '';
  const q = searchParams.get('q') ?? '';

  // React Router applies URL changes in a React "transition" (a moment later),
  // but a text box must update on every key press. So the box keeps its own
  // copy of the text, and we copy the URL back into it when the URL changes
  // for another reason (Back button, a bookmark link…).
  const [text, setText] = useState(q);
  useEffect(() => {
    setText(q);
  }, [q]);

  const visible = students.filter(
    (s) => (!major || s.major === major) && `${s.firstName} ${s.lastName}`.toLowerCase().includes(q.toLowerCase()),
  );

  function updateParam(key, value) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key); // keep the URL clean
        return next;
      },
      { replace: true }, // don't add a history entry for every key press
    );
  }

  function openRandomStudent() {
    const pool = visible.length > 0 ? visible : students;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    navigate(`/routing/students/${pick.id}`);
  }

  function handleJump(event) {
    event.preventDefault();
    const id = new FormData(event.currentTarget).get('studentNumber');
    navigate(`/routing/students/${id}`); // redirect after submit – bad ids show "not found"
  }

  return (
    <section className="stack">
      <div className="routing-filters">
        <input
          className="input"
          type="search"
          aria-label="Search by name"
          placeholder="Search by name…"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            updateParam('q', e.target.value);
          }}
        />
        <select
          className="input"
          aria-label="Filter by major"
          value={major}
          onChange={(e) => updateParam('major', e.target.value)}
        >
          <option value="">All majors</option>
          {MAJORS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="row-between">
        <span className="small muted">{visible.length} students</span>
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={openRandomStudent}>
            <Shuffle size={15} /> Random student
          </button>
          <form className="row" onSubmit={handleJump}>
            <label htmlFor="routing-jump" className="small">
              Open #
            </label>
            <input
              id="routing-jump"
              name="studentNumber"
              className="input routing-jump-input"
              type="number"
              min={1}
              defaultValue={1}
              required
            />
            <button type="submit" className="btn btn-sm btn-secondary">
              Go
            </button>
          </form>
        </div>
      </div>

      <ul className="routing-student-list">
        {visible.map((s) => (
          <li key={s.id}>
            {/* An absolute path: always correct, no matter where this component is rendered */}
            <Link to={`/routing/students/${s.id}`}>
              <span className="routing-number">#{s.id}</span>
              {s.firstName} {s.lastName}
              <span className="small muted">{s.major}</span>
            </Link>
          </li>
        ))}
        {visible.length === 0 && <li className="small muted">Nobody matches these filters.</li>}
      </ul>
    </section>
  );
}
