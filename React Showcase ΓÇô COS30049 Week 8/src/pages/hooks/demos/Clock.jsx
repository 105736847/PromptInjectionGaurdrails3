/**
 * Clock – useEffect with setInterval and a CLEANUP function.
 *
 *   useEffect(() => {
 *     const id = setInterval(tick, 1000);   // setup: runs after the component appears
 *     return () => clearInterval(id);        // cleanup: runs when it disappears
 *   }, []);                                  // [] = set up once, not after every render
 *
 * Without the cleanup, every mount would start ANOTHER interval that keeps
 * running (and updating state) forever – a classic memory leak.
 */
import { useEffect, useId, useState } from 'react';

const ZONES = {
  'Australia/Melbourne': 'Melbourne',
  'Asia/Kuching': 'Sarawak',
  'Asia/Ho_Chi_Minh': 'Ho Chi Minh City',
  'Asia/Shanghai': 'Shanghai',
  UTC: 'UTC',
};

export default function Clock() {
  const [now, setNow] = useState(() => new Date());
  const [timeZone, setTimeZone] = useState('Australia/Melbourne');
  const [hour12, setHour12] = useState(false);
  const id = useId();

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId); // stop ticking when the clock unmounts
  }, []);

  // Formatting is derived from state + the options – no effect needed for that.
  const time = now.toLocaleTimeString('en-AU', { timeZone, hour12, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('en-AU', { timeZone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="stack">
      <div className="hooks-clock">
        <time dateTime={now.toISOString()} className="hooks-clock-time">{time}</time>
        <span className="small muted">{date} · {ZONES[timeZone]}</span>
      </div>
      <div className="row">
        <label className="visually-hidden" htmlFor={id}>Time zone</label>
        <select id={id} className="input hooks-auto-width" value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
          {Object.entries(ZONES).map(([zone, label]) => <option key={zone} value={zone}>{label}</option>)}
        </select>
        <label className="switch">
          <input type="checkbox" checked={hour12} onChange={(e) => setHour12(e.target.checked)} />
          <span className="switch-track" /> 12-hour
        </label>
      </div>
    </div>
  );
}
