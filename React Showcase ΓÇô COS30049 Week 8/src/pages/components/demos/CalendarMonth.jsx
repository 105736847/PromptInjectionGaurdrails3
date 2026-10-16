/**
 * CalendarMonth – a month view built with nothing but the Date object.
 *
 * Handy Date tricks used below:
 * - new Date(year, month + 1, 0) → day "0" of NEXT month = the last day of THIS month.
 * - (getDay() + 6) % 7 turns Sunday-first (0 = Sun) into Monday-first (0 = Mon).
 * - Months overflow automatically: new Date(2026, 12, 1) is 1 January 2027.
 * - We build "YYYY-MM-DD" keys from LOCAL date parts. toISOString() would use
 *   UTC and can give you yesterday's date in Australia!
 *
 * Keyboard: the selected day is the only tab stop; ← → move a day, ↑ ↓ a week.
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CalendarMonth.module.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LEGEND = [['assignment', 'Assignment'], ['lab', 'Lab / quiz'], ['meeting', 'Meeting']];

const toKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// Due dates relative to today, so the demo always has something to show.
const TODAY = new Date();
const EVENTS = [
  { offset: -4, title: 'Lab 6 report due', type: 'lab' },
  { offset: 0, title: 'Consultation 12:00', type: 'meeting' },
  { offset: 3, title: 'Assignment 2 due 23:59', type: 'assignment' },
  { offset: 3, title: 'Team stand-up', type: 'meeting' },
  { offset: 8, title: 'Quiz 3 (online)', type: 'lab' },
  { offset: 17, title: 'Assignment 3 demo', type: 'assignment' },
  { offset: 30, title: 'Final report due', type: 'assignment' },
].map((event) => ({ ...event, date: toKey(addDays(TODAY, event.offset)) }));

export default function CalendarMonth() {
  const [selected, setSelected] = useState(TODAY);
  const [view, setView] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const gridRef = useRef(null);
  const keyboardMove = useRef(false);

  const year = view.getFullYear();
  const month = view.getMonth();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  const selectedEvents = EVENTS.filter((event) => event.date === toKey(selected));
  const selectedInView = selected.getMonth() === month && selected.getFullYear() === year;

  // After an arrow-key move, put DOM focus on the newly selected day.
  useEffect(() => {
    if (!keyboardMove.current) return;
    keyboardMove.current = false;
    gridRef.current?.querySelector('[tabindex="0"]')?.focus();
  }, [selected]);

  function select(date) {
    setSelected(date);
    setView(new Date(date.getFullYear(), date.getMonth(), 1)); // follow into the next/previous month
  }

  function handleKeyDown(event) {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    keyboardMove.current = true;
    const from = selectedInView ? selected : days[0]; // the day that currently has focus
    select(addDays(from, moves[event.key]));
  }

  const changeMonth = (step) => setView(new Date(year, month + step, 1));

  return (
    <div className={styles.layout}>
      <div className={styles.calendar}>
        <div className={styles.header}>
          <button type="button" className="btn-icon" onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <h4 className="m-0" aria-live="polite">{view.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</h4>
          <button type="button" className="btn-icon" onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>

        <div className={styles.grid} ref={gridRef} onKeyDown={handleKeyDown}>
          {WEEKDAYS.map((day) => <span key={day} className={styles.weekday} aria-hidden="true">{day}</span>)}
          {Array.from({ length: leadingBlanks }, (_, i) => <span key={`blank-${i}`} />)}
          {days.map((date) => {
            const key = toKey(date);
            const events = EVENTS.filter((event) => event.date === key);
            const isSelected = key === toKey(selected);
            const isTabStop = selectedInView ? isSelected : date.getDate() === 1;
            return (
              <button
                key={key}
                type="button"
                className={styles.day}
                data-today={key === toKey(TODAY)}
                aria-pressed={isSelected}
                tabIndex={isTabStop ? 0 : -1}
                aria-label={`${date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}${events.length ? `, ${events.length} event${events.length > 1 ? 's' : ''}` : ''}`}
                onClick={() => select(date)}
              >
                {date.getDate()}
                <span className={styles.dots} aria-hidden="true">
                  {events.map((event) => <span key={event.title} className={styles.dot} data-type={event.type} />)}
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => select(TODAY)}>Today</button>
      </div>

      <section className={styles.agenda} aria-live="polite">
        <h4 className="m-0">{selected.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
        {selectedEvents.length === 0 ? (
          <p className="small muted m-0">Nothing due – enjoy your day!</p>
        ) : (
          <ul className={styles.eventList}>
            {selectedEvents.map((event) => (
              <li key={event.title}><span className={styles.dot} data-type={event.type} aria-hidden="true" /> {event.title}</li>
            ))}
          </ul>
        )}
        <ul className={styles.legend}>
          {LEGEND.map(([type, label]) => (
            <li key={type}><span className={styles.dot} data-type={type} aria-hidden="true" /> {label}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
