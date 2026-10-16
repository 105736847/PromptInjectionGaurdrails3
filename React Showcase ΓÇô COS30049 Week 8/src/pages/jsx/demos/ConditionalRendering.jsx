/**
 * ConditionalRendering – four ways to show different UI for different data.
 *
 *   1. Early return      if (…) return <A />;   (whole component changes)
 *   2. Ternary           {cond ? <A /> : <B />}  (either/or)
 *   3. Logical AND       {cond && <A />}         (something or nothing)
 *   4. Object lookup     STATUS[status]          (many cases, no if/else chain)
 */
import { useId, useState } from 'react';
import { CircleCheck, Clock, CircleX, Award } from 'lucide-react';

// 1. EARLY RETURN – handle the "special" case first, then the normal case.
function GradeDisplay({ score }) {
  if (score === '') {
    return <span className="badge">Not marked yet</span>;
  }
  const value = Number(score);
  return (
    <span className={`badge ${value >= 50 ? 'badge-success' : 'badge-danger'}`}>
      {value}/100 – {value >= 50 ? 'Pass' : 'Fail'}
    </span>
  );
}

// 4. OBJECT LOOKUP – map each status to what it should look like.
const STATUS = {
  submitted: { label: 'Submitted', icon: CircleCheck, className: 'badge-success' },
  late: { label: 'Submitted late', icon: Clock, className: 'badge-warning' },
  missing: { label: 'Not submitted', icon: CircleX, className: 'badge-danger' },
  marked: { label: 'Marked', icon: Award, className: 'badge-primary' },
};

function SubmissionStatus({ status }) {
  const { label, icon: Icon, className } = STATUS[status]; // rename icon → Icon (components need a capital)
  return (
    <span className={`badge ${className}`}>
      <Icon size={13} aria-hidden="true" /> {label}
    </span>
  );
}

export default function ConditionalRendering() {
  const [loggedIn, setLoggedIn] = useState(true);
  const [unread, setUnread] = useState(2);
  const [score, setScore] = useState('');
  const [status, setStatus] = useState('submitted');
  const id = useId();

  return (
    <div className="grid-2">
      <div className="stack">
        <label className="switch">
          <input type="checkbox" checked={loggedIn} onChange={(e) => setLoggedIn(e.target.checked)} />
          <span className="switch-track" /> Logged in
        </label>
        <div className="row">
          <span className="label">Unread messages</span>
          <button type="button" className="btn btn-sm" aria-label="One fewer message"
            onClick={() => setUnread(Math.max(0, unread - 1))}>−</button>
          <span className="mono">{unread}</span>
          <button type="button" className="btn btn-sm" aria-label="One more message"
            onClick={() => setUnread(unread + 1)}>+</button>
        </div>
        <div className="field">
          <label className="label" htmlFor={`${id}-score`}>Score (leave empty = not marked)</label>
          <input id={`${id}-score`} className="input" type="number" min={0} max={100} value={score}
            onChange={(e) => setScore(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${id}-status`}>Submission status</label>
          <select id={`${id}-status`} className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {Object.keys(STATUS).map((key) => <option key={key} value={key}>{key}</option>)}
          </select>
        </div>
      </div>

      <div className="card stack">
        {/* 2. TERNARY: one thing OR the other */}
        <p className="m-0">
          {loggedIn ? <strong>Welcome back, Mia!</strong> : <span className="muted">Please log in to see your units.</span>}
        </p>

        {/* 3. &&: render the badge only when there ARE unread messages */}
        <p className="m-0 row">
          Inbox {unread > 0 && <span className="badge badge-danger">{unread} new</span>}
        </p>

        <p className="m-0 row">Assignment 3: <GradeDisplay score={score} /></p>
        <p className="m-0 row">Status: <SubmissionStatus status={status} /></p>
      </div>
    </div>
  );
}
