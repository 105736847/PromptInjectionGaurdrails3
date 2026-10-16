/**
 * SwaggerEmbed – FastAPI's own documentation pages, shown inside this page.
 *
 * /api/docs  (Swagger UI) and /api/redoc (ReDoc) are generated from the same
 * /api/openapi.json as the playground above: every route, parameter, Pydantic
 * model, summary and docstring you write in Python shows up there for free.
 *
 * <iframe> notes:
 *  - loading="lazy": the docs only load when you scroll near them.
 *  - sandbox: the frame may run scripts, submit forms and open pop-ups, but it may
 *    not navigate this page. Swagger UI must fetch /api/openapi.json, so it also
 *    needs allow-same-origin – and scripts + same-origin together could remove the
 *    sandbox (the browser warns about this in the console). That is fine for our OWN
 *    docs page; never combine the two for a page you don't control.
 *  - Swagger UI loads its JavaScript from a CDN, so it needs internet access.
 */
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

import { API_BASE } from '../../../api/client.js';
import useBackendStatus from '../../../hooks/useBackendStatus.js';

const PAGES = [
  { id: 'docs', label: 'Swagger UI' }, // interactive: "Try it out" on every endpoint
  { id: 'redoc', label: 'ReDoc' }, // a read-only reference
];

export default function SwaggerEmbed() {
  const [page, setPage] = useState('docs');
  const { status } = useBackendStatus(); // don't show an empty frame while the back end is down
  const src = `${API_BASE}/api/${page}`;

  // Once the docs have loaded, keep the frame even if one health check fails (uvicorn
  // --reload restarts for a second whenever a .py file is saved) – unmounting it would
  // throw away what you typed into "Try it out". Updating state while rendering is
  // React's pattern for "remember something from an earlier render".
  const [wasOnline, setWasOnline] = useState(false);
  if (status === 'online' && !wasOnline) setWasOnline(true);

  return (
    <div className="stack">
      <div className="row-between">
        <div className="btn-group" role="group" aria-label="Documentation style">
          {PAGES.map((p) => (
            <button key={p.id} type="button" className={`btn btn-sm ${page === p.id ? 'active' : ''}`} aria-pressed={page === p.id} onClick={() => setPage(p.id)}>
              {p.label} <span className="muted mono fastapi-wide-only">/api/{p.id}</span>
            </button>
          ))}
        </div>
        <a className="btn btn-sm" href={src} target="_blank" rel="noreferrer">
          Open in new tab <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>

      {status === 'offline' && wasOnline && (
        <p className="alert alert-warning m-0" role="status">
          The back end stopped answering (it may be restarting). The docs stay open – “Execute” works again once it is back.
        </p>
      )}
      {wasOnline && (
        <iframe
          key={page} // a new page → a fresh frame
          className="fastapi-docs-frame"
          src={src}
          title={`FastAPI ${PAGES.find((p) => p.id === page).label} documentation`}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer"
        />
      )}
      {status === 'checking' && !wasOnline && <p className="row muted"><span className="spinner" aria-hidden="true" /> Checking the back end…</p>}
      {status === 'offline' && !wasOnline && (
        <p className="alert alert-warning m-0">The docs are served by FastAPI itself – start the back end (see the banner above) and they appear here.</p>
      )}
    </div>
  );
}
