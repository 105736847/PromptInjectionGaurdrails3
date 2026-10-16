/**
 * LinkVsAnchor – why React apps use <Link> instead of <a href>.
 *
 * <Link> changes the URL with the History API and lets React swap components:
 * no request to the server, and all state in memory survives.
 * <a href> makes the browser load the whole page again: every component
 * restarts from scratch (watch the counter and the "page loaded" time).
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Module-level code runs once per FULL page load – a handy "page loaded at" stamp.
const PAGE_LOADED_AT = new Date().toLocaleTimeString('en-AU');

export default function LinkVsAnchor() {
  const [count, setCount] = useState(0);
  const { pathname } = useLocation();
  // Alternate between two students so every click really changes the URL.
  const target = pathname === '/routing/students/1' ? '/routing/students/2' : '/routing/students/1';

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn" onClick={() => setCount(count + 1)}>
          Clicked {count} times
        </button>
        <span className="small muted">
          Page loaded at <strong>{PAGE_LOADED_AT}</strong> · current URL <code>{pathname}</code>
        </span>
      </div>
      <p className="m-0 small">Click the button a few times, then try both links:</p>
      <div className="grid-2">
        <div className="card routing-compare">
          <strong>&lt;Link to=…&gt;</strong>
          <Link to={target}>Go to {target}</Link>
          <span className="small muted">No reload – the counter keeps its value.</span>
        </div>
        <div className="card routing-compare">
          <strong>&lt;a href=…&gt;</strong>
          <a href={target}>Go to {target}</a>
          <span className="small muted">Full page reload – the counter resets and the page-loaded time changes.</span>
        </div>
      </div>
    </div>
  );
}
