import { Menu, CircleCheck, CircleX } from 'lucide-react';
import useWindowSize from '../../../hooks/useWindowSize.js';
import useMediaQuery from './useMediaQuery.js';

/**
 * MediaQueryHook – two ways to let JavaScript react to the screen:
 *
 *   useWindowSize()               → { width, height }, re-renders on EVERY resize event
 *   useMediaQuery('(min-width…)') → true/false, re-renders only when the answer flips
 *
 * Prefer plain CSS media queries for styling. Reach for a hook only when you
 * must render something DIFFERENT (e.g. a hamburger menu instead of links).
 */
const QUERIES = [
  { query: '(min-width: 600px)', label: 'sm and up', fromWidth: (w) => w >= 600 },
  { query: '(min-width: 900px)', label: 'md and up', fromWidth: (w) => w >= 900 },
  { query: '(min-width: 1200px)', label: 'lg and up', fromWidth: (w) => w >= 1200 },
  { query: '(orientation: portrait)', label: 'taller than wide' },
  { query: '(hover: hover) and (pointer: fine)', label: 'has a mouse / trackpad' },
  { query: '(prefers-color-scheme: dark)', label: 'OS is in dark mode' },
  { query: '(prefers-reduced-motion: reduce)', label: 'user wants less animation' },
];

function Result({ value }) {
  return value ? (
    <span className="badge badge-success"><CircleCheck size={13} /> true</span>
  ) : (
    <span className="badge"><CircleX size={13} /> false</span>
  );
}

// Hooks may not be called inside a loop, so each row is its own component
// that calls useMediaQuery exactly once.
function QueryRow({ query, label, fromWidth, width }) {
  const matches = useMediaQuery(query);
  return (
    <tr>
      <td>
        <code>{query}</code>
        <div className="small muted">{label}</div>
      </td>
      <td><Result value={matches} /></td>
      <td>{fromWidth ? <Result value={fromWidth(width)} /> : <span className="small subtle">can’t tell from width</span>}</td>
    </tr>
  );
}

export default function MediaQueryHook() {
  const { width } = useWindowSize();
  const isDesktop = useMediaQuery('(min-width: 900px)');

  return (
    <div className="stack">
      {/* A realistic use: render different JSX, not just different styles */}
      <nav className="card card-subtle row-between" aria-label="Example navigation">
        <strong>Unit portal</strong>
        {isDesktop ? (
          <div className="row">
            <button type="button" className="btn btn-ghost btn-sm">Units</button>
            <button type="button" className="btn btn-ghost btn-sm">Timetable</button>
            <button type="button" className="btn btn-ghost btn-sm">Grades</button>
          </div>
        ) : (
          <button type="button" className="btn btn-sm">
            <Menu size={16} /> Menu
          </button>
        )}
      </nav>
      <p className="small muted m-0">
        ↑ <code>{'isDesktop ? <Links /> : <MenuButton />'}</code> with{' '}
        <code>isDesktop = useMediaQuery('(min-width: 900px)')</code>
      </p>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Media query</th>
              <th>useMediaQuery</th>
              <th>useWindowSize ({width}px)</th>
            </tr>
          </thead>
          <tbody>
            {QUERIES.map((item) => (
              <QueryRow key={item.query} {...item} width={width} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
