/**
 * RouteNotFound – rendered by the catch-all route (path="*") when no other
 * route inside the portal matches the URL.
 */
import { Link, useLocation } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';

export default function RouteNotFound() {
  const { pathname } = useLocation();
  return (
    <section className="routing-empty">
      <MapPinOff size={32} aria-hidden="true" />
      <h4 className="m-0">404 – page not found</h4>
      <p className="m-0 small muted">
        Nothing lives at <code>{pathname}</code>.
      </p>
      <Link to="/routing" className="btn btn-sm">
        Back to the directory
      </Link>
    </section>
  );
}
