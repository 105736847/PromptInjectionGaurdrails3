import { useState } from 'react';
import styles from './Timetable.module.css';

/**
 * A semantic, data-driven table: a weekly class timetable.
 *
 * - <caption> names the table; <thead>/<tbody>/<tfoot> group the rows.
 * - <th scope="col"> / <th scope="row"> tell screen readers which header
 *   belongs to each cell ("Tuesday, 10:00: COS30043 Lecture").
 * - rowSpan makes a 2-hour class cover two rows; colSpan joins columns.
 *   In JSX they are camelCase: rowSpan, colSpan (not rowspan/colspan).
 */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16]; // each row = one hour
const LUNCH = 12;

const sessions = [
  { day: 'Mon', start: 9, length: 2, unit: 'COS30049', type: 'Lecture', room: 'EN101' },
  { day: 'Mon', start: 13, length: 2, unit: 'COS30049', type: 'Workshop', room: 'ATC325' },
  { day: 'Tue', start: 10, length: 1, unit: 'COS30043', type: 'Lecture', room: 'Online' },
  { day: 'Tue', start: 14, length: 2, unit: 'COS30043', type: 'Lab', room: 'EN207' },
  { day: 'Wed', start: 9, length: 1, unit: 'SWE30003', type: 'Lecture', room: 'AMDC501' },
  { day: 'Wed', start: 10, length: 2, unit: 'SWE30003', type: 'Tutorial', room: 'BA603' },
  { day: 'Thu', start: 13, length: 3, unit: 'COS30049', type: 'Studio', room: 'ATC620' },
  { day: 'Fri', start: 9, length: 2, unit: 'COS20007', type: 'Lab', room: 'EN310' },
  { day: 'Fri', start: 15, length: 1, unit: 'Team', type: 'Meeting', room: 'Library L3' },
];

const units = [...new Set(sessions.map((s) => s.unit))];
const label = (hour) => `${String(hour).padStart(2, '0')}:00`;

export default function Timetable() {
  const [highlight, setHighlight] = useState('all');

  // Derived data – computed during render, no extra state needed.
  const hoursPerDay = DAYS.map((day) =>
    sessions.filter((s) => s.day === day).reduce((sum, s) => sum + s.length, 0),
  );
  const totalHours = hoursPerDay.reduce((a, b) => a + b, 0);

  function renderCell(day, hour) {
    const starting = sessions.find((s) => s.day === day && s.start === hour);
    if (starting) {
      const dimmed = highlight !== 'all' && highlight !== starting.unit;
      return (
        <td key={day} rowSpan={starting.length} className={styles.slot}>
          <div className={`${styles.session} ${styles[starting.type.toLowerCase()]} ${dimmed ? styles.dimmed : ''}`}>
            <strong>{starting.unit}</strong>
            <span>{starting.type}</span>
            <span className={styles.room}>{starting.room}</span>
          </div>
        </td>
      );
    }
    // A session that started earlier already covers this cell via rowSpan → render nothing.
    const covered = sessions.some((s) => s.day === day && s.start < hour && hour < s.start + s.length);
    return covered ? null : <td key={day} className={styles.slot} />;
  }

  return (
    <div className="stack">
      <label className="row small">
        Highlight unit
        <select className="input" style={{ width: 150, height: 34 }} value={highlight} onChange={(e) => setHighlight(e.target.value)}>
          <option value="all">All units</option>
          {units.map((unit) => <option key={unit}>{unit}</option>)}
        </select>
      </label>

      <div className="table-wrap">
        <table className={`table ${styles.table}`}>
          <caption>Semester 2 timetable – Team Nebula (fictional)</caption>
          <thead>
            <tr>
              <th scope="col">Time</th>
              {DAYS.map((day) => <th key={day} scope="col">{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) =>
              hour === LUNCH ? (
                <tr key={hour}>
                  <th scope="row">{label(hour)}</th>
                  {/* colSpan: one cell stretched across all five day columns */}
                  <td colSpan={DAYS.length} className={styles.lunch}>Lunch break – no classes</td>
                </tr>
              ) : (
                <tr key={hour}>
                  <th scope="row">{label(hour)}</th>
                  {DAYS.map((day) => renderCell(day, hour))}
                </tr>
              ),
            )}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Hours</th>
              {hoursPerDay.map((hours, i) => <td key={DAYS[i]} className="num">{hours} h</td>)}
            </tr>
            <tr>
              <th scope="row">Total</th>
              <td colSpan={DAYS.length}>{totalHours} contact hours per week</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
