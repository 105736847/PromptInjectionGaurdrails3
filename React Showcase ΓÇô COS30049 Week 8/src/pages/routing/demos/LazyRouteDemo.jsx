/**
 * LazyRouteDemo – code splitting with React.lazy() and <Suspense>.
 *
 * App.jsx loads every page like this: the JavaScript for a page is only
 * downloaded the first time someone opens it. Here we lazy-load one small
 * component (with an artificial 1.5 s delay so you can see the fallback).
 * Once downloaded, the module is cached: hide and show it again – no spinner.
 */
import { lazy, Suspense, useState } from 'react';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// lazy() takes a function that returns import(...). Nothing is downloaded yet!
const CampusReport = lazy(() => wait(1500).then(() => import('./CampusReport.jsx')));

export default function LazyRouteDemo() {
  const [show, setShow] = useState(false);

  return (
    <div className="stack">
      <div>
        <button type="button" className="btn btn-primary" onClick={() => setShow(!show)} aria-expanded={show}>
          {show ? 'Hide' : 'Show'} the campus report
        </button>
      </div>
      {show && (
        // While CampusReport.jsx is downloading, Suspense shows the fallback.
        <Suspense
          fallback={
            <p className="row muted m-0" role="status">
              <span className="spinner" aria-hidden="true" /> Downloading CampusReport.jsx…
            </p>
          }
        >
          <CampusReport />
        </Suspense>
      )}
      <p className="m-0 small muted">
        Open DevTools → Network before the first click to see the separate JavaScript file arrive.
      </p>
    </div>
  );
}
