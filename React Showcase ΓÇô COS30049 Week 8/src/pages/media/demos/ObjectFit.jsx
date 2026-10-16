import { useState } from 'react';
import styles from './ObjectFit.module.css';

/**
 * object-fit: how an image fills a box with a DIFFERENT shape.
 *
 * The same wide photo is placed in five square boxes. object-position
 * chooses which part stays visible when the image is cropped or letterboxed.
 * Typical use: user avatars and product cards (object-fit: cover).
 */
const FITS = [
  { value: 'cover', note: 'Fills the box, crops the overflow (most common)' },
  { value: 'contain', note: 'Whole image visible, may leave empty bands' },
  { value: 'fill', note: 'Stretches to fit – distorts! (the default)' },
  { value: 'none', note: 'Original size, no scaling' },
  { value: 'scale-down', note: 'Like none or contain – whichever is smaller' },
];
const POSITIONS = ['center', 'top', 'bottom', 'left', 'right', '20% 80%'];

export default function ObjectFit() {
  const [position, setPosition] = useState('center');
  const [ratio, setRatio] = useState('1 / 1');

  return (
    <div className="stack">
      <div className="row">
        <span className="small muted">object-position:</span>
        <div className="row" style={{ gap: 4 }} role="group" aria-label="object-position">
          {POSITIONS.map((p) => (
            <button key={p} type="button" className={`btn btn-sm ${position === p ? 'btn-secondary' : ''}`}
              aria-pressed={position === p} onClick={() => setPosition(p)}>
              {p}
            </button>
          ))}
        </div>
        <label className="row small" style={{ gap: 6 }}>
          aspect-ratio
          <select className="input" style={{ width: 90, height: 32 }} value={ratio} onChange={(e) => setRatio(e.target.value)}>
            <option>1 / 1</option>
            <option>3 / 4</option>
            <option>16 / 9</option>
          </select>
        </label>
      </div>

      <ul className={styles.grid}>
        {FITS.map((fit) => (
          <li key={fit.value} className="stack-sm">
            <div className={styles.box} style={{ aspectRatio: ratio }}>
              <img
                src="https://picsum.photos/seed/cos30049-lecture/480/270"
                alt=""
                loading="lazy"
                className={styles.img}
                // Values that change at runtime → inline style object (camelCase keys)
                style={{ objectFit: fit.value, objectPosition: position }}
              />
            </div>
            <code className="small" style={{ alignSelf: 'flex-start' }}>object-fit: {fit.value}</code>
            <span className="subtle small">{fit.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
