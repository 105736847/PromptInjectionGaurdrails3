import { Monitor, Laptop, Tablet, Smartphone } from 'lucide-react';
import useWindowSize from '../../../hooks/useWindowSize.js';
import './Breakpoints.css';

/**
 * Breakpoints – the window widths where a layout changes.
 * We use the same names and values as MUI (Material UI):
 *
 *   xs 0px · sm 600px · md 900px · lg 1200px · xl 1536px
 *
 * The ruler reads the width in JavaScript (useWindowSize). The card grid
 * below does NOT use JavaScript at all – only CSS media queries.
 * Resize your browser window (or open DevTools' device toolbar) to watch both.
 */
const BREAKPOINTS = [
  { name: 'xs', min: 0, device: 'phone', Icon: Smartphone },
  { name: 'sm', min: 600, device: 'large phone / small tablet', Icon: Tablet },
  { name: 'md', min: 900, device: 'tablet / small laptop', Icon: Tablet },
  { name: 'lg', min: 1200, device: 'laptop', Icon: Laptop },
  { name: 'xl', min: 1536, device: 'large desktop', Icon: Monitor },
];
const RULER_MAX = 1920; // the right-hand end of the ruler, in px

const UNITS = ['COS30049', 'COS20019', 'COS30043', 'COS20007', 'COS10026', 'COS30045'];

export default function Breakpoints() {
  const { width } = useWindowSize();

  // Derived during render: the last breakpoint whose minimum we have passed.
  const current = BREAKPOINTS.findLast((bp) => width >= bp.min);
  const { Icon } = current; // components must start with a capital letter
  const markerPosition = Math.min(width / RULER_MAX, 1) * 100;

  return (
    <div className="stack-lg">
      <div className="row">
        <Icon size={28} aria-hidden="true" />
        <div>
          <strong className="layout-bp-now">
            {width}px → <span className="mono">{current.name}</span>
          </strong>
          <div className="small muted">Typical device: {current.device}</div>
        </div>
      </div>

      <div className="layout-bp-ruler" aria-label={`Window width ${width} pixels, breakpoint ${current.name}`} role="img">
        {BREAKPOINTS.map((bp, i) => {
          const end = BREAKPOINTS[i + 1]?.min ?? RULER_MAX;
          return (
            <div
              key={bp.name}
              className={`layout-bp-segment ${bp.name === current.name ? 'is-active' : ''}`}
              style={{ width: `${((end - bp.min) / RULER_MAX) * 100}%` }}
            >
              <span className="layout-bp-name">{bp.name}</span>
              <span className="layout-bp-min">{bp.min}</span>
            </div>
          );
        })}
        <div className="layout-bp-marker" style={{ left: `${markerPosition}%` }}>
          <span>you</span>
        </div>
      </div>

      <div>
        <p className="small muted mb-1">
          Columns set with <code>@media (min-width: …)</code> only – no JavaScript:
        </p>
        <div className="layout-bp-grid">
          {UNITS.map((code) => (
            <article key={code} className="layout-bp-card">
              <strong className="mono">{code}</strong>
              <span className="small muted">Semester 2</span>
            </article>
          ))}
        </div>
      </div>

      <div>
        <p className="small muted mb-1">Visible from this breakpoint and up (CSS only):</p>
        <div className="row">
          {BREAKPOINTS.map((bp) => (
            <span key={bp.name} className={`badge badge-primary layout-bp-up-${bp.name}`}>
              {bp.name} and up
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
