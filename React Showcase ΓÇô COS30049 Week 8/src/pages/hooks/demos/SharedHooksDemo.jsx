/**
 * SharedHooksDemo – reusing the app's own custom hooks from src/hooks/.
 *
 *   useLocalStorage(key, initial) → works like useState, but the value is saved in
 *                                   the browser, so it SURVIVES A PAGE REFRESH.
 *   useWindowSize()               → { width, height }, re-renders on window resize.
 *
 * Open src/hooks/useLocalStorage.js and src/hooks/useWindowSize.js to see
 * how little code each one needs: a useState plus a useEffect.
 */
import { useId } from 'react';
import { Eraser, Monitor, Smartphone, Tablet } from 'lucide-react';
import useLocalStorage from '../../../hooks/useLocalStorage.js';
import useWindowSize from '../../../hooks/useWindowSize.js';

const MAX_WIDTH_SHOWN = 1920;

function getBreakpoint(width) {
  if (width < 640) return { name: 'Mobile', icon: Smartphone };
  if (width < 960) return { name: 'Tablet', icon: Tablet };
  return { name: 'Desktop', icon: Monitor };
}

export default function SharedHooksDemo() {
  const [notes, setNotes] = useLocalStorage('hooks-demo-notes', '');
  const { width, height } = useWindowSize();
  const id = useId();

  const { name: breakpoint, icon: BreakpointIcon } = getBreakpoint(width);

  return (
    <div className="grid-2">
      <div className="stack-sm">
        <label className="label" htmlFor={id}>My lecture notes (saved in localStorage)</label>
        <textarea id={id} className="input" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Write something, then refresh the page (F5) – it will still be here." />
        <div className="row-between">
          <span className="small muted">{notes.length} characters saved under the key “hooks-demo-notes”</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setNotes('')} disabled={!notes}>
            <Eraser size={14} /> Clear
          </button>
        </div>
      </div>

      <div className="stack-sm">
        <span className="label">Window size (resize your browser)</span>
        <p className="hooks-window-size m-0">
          {width} × {height}
          <span className="badge badge-primary"><BreakpointIcon size={13} /> {breakpoint}</span>
        </p>
        <div className="hooks-size-bar" aria-hidden="true">
          <div style={{ width: `${Math.min(100, (width / MAX_WIDTH_SHOWN) * 100)}%` }} />
          <span style={{ left: `${(640 / MAX_WIDTH_SHOWN) * 100}%` }}>640</span>
          <span style={{ left: `${(960 / MAX_WIDTH_SHOWN) * 100}%` }}>960</span>
        </div>
        <p className="small muted m-0">
          CSS media queries can do most responsive work; reach for a hook like this when your JavaScript needs the size
          (e.g. to render a different component on mobile).
        </p>
      </div>
    </div>
  );
}
