import { useEffect, useState } from 'react';
import styles from './AnalogClock.module.css';

/**
 * An analog clock drawn with inline SVG and driven by state.
 *
 * - useEffect starts a 1-second interval that stores the current time in
 *   state; its cleanup function stops the interval when the clock unmounts.
 * - Every render turns the time into angles and rotates the hands with the
 *   SVG transform="rotate(angle cx cy)" attribute. No canvas, no library.
 */
const ZONES = [
  { tz: 'Australia/Melbourne', label: 'Melbourne' },
  { tz: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh City' },
  { tz: 'Asia/Shanghai', label: 'Shanghai' },
  { tz: 'Asia/Kolkata', label: 'New Delhi' },
  { tz: 'Europe/London', label: 'London' },
];

// Read hour / minute / second of `date` in another time zone with Intl.
function timeIn(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { h: get('hour'), m: get('minute'), s: get('second') };
}

export default function AnalogClock() {
  const [now, setNow] = useState(() => new Date());
  const [zone, setZone] = useState(ZONES[0].tz);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id); // cleanup: no ticking after unmount
  }, []);

  const { h, m, s } = timeIn(now, zone);
  const angles = {
    hour: (h % 12) * 30 + m * 0.5, // 360° / 12 hours = 30° per hour
    minute: m * 6 + s * 0.1, // 360° / 60 minutes = 6° per minute
    second: s * 6,
  };
  const label = ZONES.find((z) => z.tz === zone).label;
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="stack" style={{ alignItems: 'center' }}>
      <svg viewBox="0 0 200 200" className={styles.clock} role="img" aria-label={`Clock showing ${h}:${pad(m)} in ${label}`}>
        <circle cx="100" cy="100" r="95" className={styles.face} />

        {/* 60 tick marks generated from an array – every 5th one is longer */}
        {Array.from({ length: 60 }, (_, i) => (
          <line key={i} x1="100" y1="9" x2="100" y2={i % 5 === 0 ? 21 : 15}
            className={i % 5 === 0 ? styles.major : styles.minor} transform={`rotate(${i * 6} 100 100)`} />
        ))}

        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1;
          const rad = (n * 30 * Math.PI) / 180;
          return (
            <text key={n} x={100 + 68 * Math.sin(rad)} y={100 - 68 * Math.cos(rad) + 5} className={styles.number}>
              {n}
            </text>
          );
        })}

        <line x1="100" y1="100" x2="100" y2="52" className={styles.hour} transform={`rotate(${angles.hour} 100 100)`} />
        <line x1="100" y1="100" x2="100" y2="30" className={styles.minute} transform={`rotate(${angles.minute} 100 100)`} />
        <line x1="100" y1="115" x2="100" y2="22" className={styles.second} transform={`rotate(${angles.second} 100 100)`} />
        <circle cx="100" cy="100" r="4" className={styles.pin} />
      </svg>

      <time dateTime={now.toISOString()} className="mono" style={{ fontSize: '1.4rem' }}>
        {pad(h)}:{pad(m)}:{pad(s)}
      </time>
      <select className="input" style={{ maxWidth: 220 }} value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Time zone">
        {ZONES.map((z) => <option key={z.tz} value={z.tz}>{z.label}</option>)}
      </select>
    </div>
  );
}
