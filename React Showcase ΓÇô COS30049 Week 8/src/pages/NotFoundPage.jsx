import { Link, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

/** Shown for any URL that does not match a route (path="*" in App.jsx). */
export default function NotFoundPage() {
  const { pathname } = useLocation();
  useDocumentTitle('Page not found');

  return (
    <div className="stack center" style={{ alignItems: 'center', padding: '64px 0' }}>
      <Compass size={56} className="subtle" aria-hidden="true" />
      <p className="page-eyebrow">Error 404</p>
      <h1>This page does not exist</h1>
      <p className="muted">
        No route matches <code>{pathname}</code>. In a single-page app, React Router decides what to show
        for every URL – including this one.
      </p>
      <Link to="/" className="btn btn-primary">
        Back to the overview
      </Link>
    </div>
  );
}
