import { useId, useState } from 'react';

/**
 * A reusable SVG progress ring, controlled by a slider.
 *
 * The trick: a circle's outline can be drawn as a dashed line.
 *   strokeDasharray  = the circumference (one dash as long as the whole circle)
 *   strokeDashoffset = how much of that dash to hide → circumference × (1 − value/100)
 * A CSS transition on stroke-dashoffset animates every change for free.
 */
function Ring({ value, size = 120, stroke = 12, label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  const color = value < 40 ? 'var(--color-danger)' : value < 75 ? 'var(--color-warning)' : 'var(--color-success)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${value}%`}>
      {/* Grey track */}
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} style={{ stroke: 'var(--color-surface-3)' }} />
      {/* Coloured progress, rotated -90° so it starts at 12 o'clock */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ stroke: color, transition: 'stroke-dashoffset 400ms ease, stroke 400ms ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        style={{ fill: 'var(--color-text)', fontSize: size / 5, fontWeight: 700 }}>
        {value}%
      </text>
    </svg>
  );
}

export default function ProgressRing() {
  const [value, setValue] = useState(68);
  const id = useId();

  return (
    <div className="stack" style={{ alignItems: 'center' }}>
      {/* The same component with different props – that is what makes it reusable */}
      <div className="row" style={{ justifyContent: 'center', gap: 20 }}>
        <Ring value={value} size={64} stroke={7} label="Small ring" />
        <Ring value={value} size={120} stroke={12} label="Model accuracy" />
        <Ring value={value} size={96} stroke={22} label="Thick ring" />
      </div>
      <div className="field" style={{ width: 'min(320px, 100%)' }}>
        <label className="label" htmlFor={id}>Model accuracy: {value}%</label>
        <input id={id} type="range" min="0" max="100" value={value} onChange={(e) => setValue(Number(e.target.value))} />
      </div>
      <div className="row">
        {[0, 35, 68, 100].map((preset) => (
          <button key={preset} type="button" className="btn btn-sm" onClick={() => setValue(preset)}>{preset}%</button>
        ))}
      </div>
    </div>
  );
}
