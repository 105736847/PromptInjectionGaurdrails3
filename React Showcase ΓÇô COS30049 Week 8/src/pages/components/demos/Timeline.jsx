/**
 * Timeline – semester milestones as an ordered list.
 *
 * - Semantic HTML: <ol> (order matters) + <time dateTime="…"> for machine-readable dates.
 * - Each milestone's status (done / next / upcoming) is DERIVED from today's
 *   date during render – it is never stored in state.
 * - The vertical line and the dots are pure CSS (::before pseudo-elements).
 */
import { useState } from 'react';
import { Award, BookOpen, CalendarClock, ClipboardCheck, Coffee, FileText, Flag, GraduationCap } from 'lucide-react';
import styles from './Timeline.module.css';

// "YYYY-MM-DD" from LOCAL date parts (toISOString() would convert to UTC and shift the day).
const toDateAttr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Dates use the current year, so the demo stays meaningful every semester.
const YEAR = new Date().getFullYear();
const MILESTONES = [
  { date: new Date(YEAR, 7, 3), title: 'Semester 2 begins', text: 'Week 1 – meet your team and tutor.', icon: Flag },
  { date: new Date(YEAR, 7, 24), title: 'Assignment 1: Project proposal', text: 'Problem statement, dataset and team charter.', icon: FileText },
  { date: new Date(YEAR, 7, 31), title: 'Census date', text: 'Last day to withdraw without financial penalty.', icon: CalendarClock },
  { date: new Date(YEAR, 8, 21), title: 'Mid-semester break', text: 'Catch up on labs – and rest!', icon: Coffee },
  { date: new Date(YEAR, 9, 5), title: 'Assignment 2: ML model', text: 'Trained model + evaluation report.', icon: ClipboardCheck },
  { date: new Date(YEAR, 9, 26), title: 'Assignment 3: Full-stack app', text: 'React front-end + FastAPI back-end demo.', icon: BookOpen },
  { date: new Date(YEAR, 10, 9), title: 'Exam period', text: 'Check your personal exam timetable.', icon: Award },
  { date: new Date(YEAR, 11, 4), title: 'Results released', text: 'Celebrate – you made it!', icon: GraduationCap },
];

export default function Timeline() {
  const [hidePast, setHidePast] = useState(false);
  const today = new Date();
  const nextIndex = MILESTONES.findIndex((m) => m.date >= today); // -1 when everything is past

  const items = MILESTONES.map((milestone, index) => ({
    ...milestone,
    status: nextIndex === -1 || index < nextIndex ? 'done' : index === nextIndex ? 'next' : 'upcoming',
  })).filter((item) => !(hidePast && item.status === 'done'));

  return (
    <div className="stack">
      <label className="switch">
        <input type="checkbox" checked={hidePast} onChange={(e) => setHidePast(e.target.checked)} />
        <span className="switch-track" />
        Hide completed milestones
      </label>

      <ol className={styles.timeline}>
        {items.map(({ date, title, text, icon: Icon, status }) => (
          <li key={title} className={styles.item} data-status={status}>
            <span className={styles.marker} aria-hidden="true"><Icon size={16} /></span>
            <div className={styles.content}>
              <time dateTime={toDateAttr(date)} className={styles.date}>
                {date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
              </time>
              <strong>
                {title} {status === 'next' && <span className="badge badge-primary">Up next</span>}
                {status === 'done' && <span className="visually-hidden">(completed)</span>}
              </strong>
              <span className="small muted">{text}</span>
            </div>
          </li>
        ))}
      </ol>
      {items.length === 0 && <p className="muted small">All milestones are complete. 🎓</p>}
    </div>
  );
}
