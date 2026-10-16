import { useEffect, useState } from 'react';
import { Plus, Settings, Info, CircleCheck, TriangleAlert, CircleAlert } from 'lucide-react';
import './DesignSystemGallery.css';

/**
 * DesignSystemGallery – the global classes defined once in src/index.css.
 *
 * main.jsx imports index.css a single time; after that ANY component can
 * use these classes through `className`. Write a style once, reuse it
 * everywhere – that is the idea behind a design system.
 * Click a label under a specimen to copy its className.
 */
function Specimen({ label, children }) {
  const [copied, setCopied] = useState(false);

  // Hide the "Copied" message again after a moment (and clean up the timer).
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(label);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (e.g. insecure context) – nothing else to do.
    }
  }

  return (
    <figure className="styling-ds-specimen">
      <div className="styling-ds-sample">{children}</div>
      <figcaption>
        <button type="button" className="styling-ds-label" onClick={copy} title="Copy className">
          {copied ? 'Copied ✓' : label}
        </button>
      </figcaption>
    </figure>
  );
}

const BUTTONS = ['btn', 'btn btn-primary', 'btn btn-secondary', 'btn btn-ghost', 'btn btn-success', 'btn btn-danger'];
const BADGES = ['badge', 'badge badge-primary', 'badge badge-success', 'badge badge-warning', 'badge badge-danger', 'badge badge-info', 'badge badge-code'];
const ALERTS = [
  { type: 'info', Icon: Info, text: 'Lab 8 is now available.' },
  { type: 'success', Icon: CircleCheck, text: 'Assignment submitted.' },
  { type: 'warning', Icon: TriangleAlert, text: 'Due in 2 days.' },
  { type: 'danger', Icon: CircleAlert, text: 'Upload failed.' },
];
const PERIODS = ['Day', 'Week', 'Month'];

export default function DesignSystemGallery() {
  const [period, setPeriod] = useState('Week');

  return (
    <div className="stack-lg">
      <section>
        <h4 className="styling-ds-heading">Buttons</h4>
        <div className="styling-ds-row">
          {BUTTONS.map((cls) => (
            <Specimen key={cls} label={cls}>
              <button type="button" className={cls}>{cls.split('-')[1] ?? 'default'}</button>
            </Specimen>
          ))}
        </div>
      </section>

      <section>
        <h4 className="styling-ds-heading">Sizes, icons, states & groups</h4>
        <div className="styling-ds-row">
          <Specimen label="btn btn-primary btn-sm">
            <button type="button" className="btn btn-primary btn-sm">Small</button>
          </Specimen>
          <Specimen label="btn btn-primary btn-lg">
            <button type="button" className="btn btn-primary btn-lg"><Plus size={18} /> Large</button>
          </Specimen>
          <Specimen label="btn btn-primary (disabled)">
            <button type="button" className="btn btn-primary" disabled>Disabled</button>
          </Specimen>
          <Specimen label="btn-icon">
            <button type="button" className="btn-icon" aria-label="Settings"><Settings size={18} /></button>
          </Specimen>
          <Specimen label="btn-group + .active">
            <div className="btn-group" role="group" aria-label="Period">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${p === period ? 'active' : ''}`}
                  aria-pressed={p === period}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </Specimen>
        </div>
      </section>

      <section>
        <h4 className="styling-ds-heading">Badges & avatar</h4>
        <div className="styling-ds-row">
          {BADGES.map((cls) => (
            <Specimen key={cls} label={cls}>
              <span className={cls}>{cls.split('-')[1] ?? 'default'}</span>
            </Specimen>
          ))}
          <Specimen label="avatar">
            <span className="avatar">AK</span>
          </Specimen>
          <Specimen label="spinner">
            <span className="spinner" role="status" aria-label="Loading" />
          </Specimen>
        </div>
      </section>

      <section>
        <h4 className="styling-ds-heading">Alerts & cards</h4>
        <div className="styling-ds-grid">
          {ALERTS.map(({ type, Icon, text }) => (
            <Specimen key={type} label={`alert alert-${type}`}>
              <div className={`alert alert-${type}`}><Icon size={18} /> {text}</div>
            </Specimen>
          ))}
          <Specimen label="card">
            <div className="card"><h5 className="card-title">card</h5><span className="small muted">Plain surface</span></div>
          </Specimen>
          <Specimen label="card card-hover">
            <div className="card card-hover"><h5 className="card-title">card-hover</h5><span className="small muted">Hover me</span></div>
          </Specimen>
          <Specimen label="card card-subtle">
            <div className="card card-subtle"><h5 className="card-title">card-subtle</h5><span className="small muted">Quiet background</span></div>
          </Specimen>
        </div>
      </section>
    </div>
  );
}
