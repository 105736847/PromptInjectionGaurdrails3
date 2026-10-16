/**
 * EnrolmentProgress – a multi-step progress bar and a loading button.
 *
 * The loading button pattern:
 * - show a spinner and change the label ("Saving…"),
 * - disable the button so it can't be clicked twice (no duplicate requests!),
 * - set aria-busy so assistive technology knows something is happening.
 * The fake "save" is a setTimeout; its id is kept in a ref so we can cancel it
 * if the component unmounts before it finishes.
 * (Heads-up: disabling a button that has keyboard focus can drop that focus.
 * Some design systems use aria-disabled="true" plus a guard in onClick instead.)
 */
import { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import styles from './Progress.module.css';

const TASKS = ['Accept offer', 'Pay deposit', 'Choose units', 'Build timetable', 'Collect ID card'];

export default function EnrolmentProgress() {
  const [done, setDone] = useState(2); // number of completed tasks
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []); // cleanup on unmount only

  function completeNext() {
    setSaving(true);
    timerRef.current = setTimeout(() => {
      setDone((d) => Math.min(d + 1, TASKS.length));
      setSaving(false);
    }, 1200);
  }

  const allDone = done === TASKS.length;

  return (
    <div className="stack">
      <div className="row-between">
        <strong>Enrolment checklist</strong>
        <span className="small muted">{done} of {TASKS.length} complete</span>
      </div>

      {/* aria-valuetext gives a friendlier announcement than just a number */}
      <ol
        className={styles.segments}
        role="progressbar"
        aria-label="Enrolment progress"
        aria-valuemin={0}
        aria-valuemax={TASKS.length}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${TASKS.length} tasks complete`}
      >
        {TASKS.map((task, index) => (
          <li key={task} className={styles.segment} data-state={index < done ? 'done' : index === done ? 'current' : 'todo'}>
            <span className={styles.segmentBar} />
            <span className={styles.segmentLabel}>
              {index < done && <Check size={12} aria-hidden="true" />} {task}
            </span>
          </li>
        ))}
      </ol>

      <div className="row">
        <button type="button" className="btn btn-primary" onClick={completeNext} disabled={saving || allDone} aria-busy={saving}>
          {saving && <span className={styles.buttonSpinner} aria-hidden="true" />}
          {saving ? 'Saving…' : allDone ? 'All done 🎉' : `Complete “${TASKS[done]}”`}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDone(0)} disabled={saving || done === 0}>
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </button>
      </div>
    </div>
  );
}
