/**
 * ZeroPitfall – the classic `&&` bug.
 *
 *   {count && <Badge />}
 *
 * `a && b` returns `a` when `a` is falsy. For false/null/undefined React renders
 * nothing – but 0 is a NUMBER, and React happily renders numbers. So when
 * count is 0 a stray "0" appears on the page.
 *
 * Fix: make the left side a real boolean → {count > 0 && <Badge />}
 */
import { useState } from 'react';

function Badge({ count }) {
  return <span className="badge badge-danger">{count} due</span>;
}

export default function ZeroPitfall() {
  const [assignmentsDue, setAssignmentsDue] = useState(0);

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn btn-sm" aria-label="Decrease"
          onClick={() => setAssignmentsDue(Math.max(0, assignmentsDue - 1))}>
          −
        </button>
        <span>assignmentsDue = <strong className="mono">{assignmentsDue}</strong></span>
        <button type="button" className="btn btn-sm" aria-label="Increase"
          onClick={() => setAssignmentsDue(assignmentsDue + 1)}>
          +
        </button>
      </div>

      <div className="grid-2">
        <div className="card jsx-pitfall-wrong">
          <p className="small mono m-0">{'{assignmentsDue && <Badge />}'}</p>
          <p className="jsx-pitfall-output">
            Assignments: {assignmentsDue && <Badge count={assignmentsDue} />}
          </p>
          <p className="small muted m-0">
            {assignmentsDue === 0 ? '❌ See the lonely "0"? That is the bug.' : 'Looks fine… until the value is 0.'}
          </p>
        </div>

        <div className="card jsx-pitfall-right">
          <p className="small mono m-0">{'{assignmentsDue > 0 && <Badge />}'}</p>
          <p className="jsx-pitfall-output">
            Assignments: {assignmentsDue > 0 && <Badge count={assignmentsDue} />}
          </p>
          <p className="small muted m-0">✅ A comparison gives true/false, and false renders nothing.</p>
        </div>
      </div>
    </div>
  );
}
