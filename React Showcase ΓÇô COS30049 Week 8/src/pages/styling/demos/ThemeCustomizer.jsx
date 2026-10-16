import { useId, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Slider from './Slider.jsx';
import './ThemeCustomizer.css';

/**
 * ThemeCustomizer – React sets a few CSS custom properties (variables);
 * the CSS file does everything else with var(--…).
 *
 *   <div style={{ '--accent': '#0e9f8e', '--ui-radius': '12px' }}>
 *
 * Custom property names contain a dash, so they must be QUOTED object keys.
 * Every element inside the div inherits the variables – and because the
 * app's global classes (.btn-primary, .badge-primary, .input…) are built on
 * variables too, re-mapping them in ThemeCustomizer.css re-themes those as well.
 */
const PRESETS = [
  { name: 'Indigo', accent: '#4f46e5' },
  { name: 'Teal', accent: '#0e9f8e' },
  { name: 'Sunset', accent: '#e8590c' },
  { name: 'Rose', accent: '#d6336c' },
];
const DEFAULTS = { accent: '#4f46e5', radius: 10, scale: 1, space: 14 };

// Choose dark or light text depending on how bright the accent is.
function readableTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#111827' : '#ffffff';
}

export default function ThemeCustomizer() {
  const [theme, setTheme] = useState(DEFAULTS);
  const colorId = useId();
  const set = (key) => (value) => setTheme((prev) => ({ ...prev, [key]: value }));

  // Only these five values come from React.
  const cssVariables = {
    '--accent': theme.accent,
    '--on-accent': readableTextColor(theme.accent),
    '--ui-radius': `${theme.radius}px`,
    '--font-scale': theme.scale,
    '--space': `${theme.space}px`,
  };

  return (
    <div className="grid-2">
      <div className="stack">
        <div className="row">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="styling-theme-swatch"
              style={{ '--swatch': preset.accent }}
              aria-pressed={theme.accent === preset.accent}
              onClick={() => set('accent')(preset.accent)}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <div className="row">
          <label className="label" htmlFor={colorId}>Accent colour</label>
          <input id={colorId} type="color" className="input" value={theme.accent} onChange={(event) => set('accent')(event.target.value)} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTheme(DEFAULTS)}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <Slider label="Corner radius" value={theme.radius} onChange={set('radius')} max={24} unit="px" />
        <Slider label="Font scale" value={theme.scale} onChange={set('scale')} min={0.85} max={1.3} step={0.05} unit="×" />
        <Slider label="Spacing" value={theme.space} onChange={set('space')} min={6} max={24} unit="px" />
        <pre className="demo-output">{`style={${JSON.stringify(cssVariables, null, 2)}}`}</pre>
      </div>

      {/* Everything inside this div reads the variables above */}
      <div className="styling-theme" style={cssVariables}>
        <article className="styling-theme-card">
          <div className="row-between">
            <h4 className="styling-theme-title">Assignment 3</h4>
            <span className="badge badge-primary">In progress</span>
          </div>
          <p className="styling-theme-text">
            Connect your React front end to the FastAPI back end and show the model’s predictions.
          </p>
          <div className="styling-theme-progress" role="progressbar" aria-valuenow={65} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
            <span style={{ width: '65%' }} />
          </div>
          <div className="field">
            <label className="label" htmlFor={`${colorId}-team`}>Team name</label>
            <input id={`${colorId}-team`} className="input" placeholder="e.g. Team Kookaburra" />
          </div>
          <div className="row">
            <button type="button" className="btn btn-primary">Submit</button>
            <button type="button" className="btn btn-secondary">Save draft</button>
          </div>
        </article>
      </div>
    </div>
  );
}
