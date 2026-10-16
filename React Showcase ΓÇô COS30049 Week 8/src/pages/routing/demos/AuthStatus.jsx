/**
 * AuthStatus – a control panel for the pretend login.
 *
 * It reads the SAME AuthContext as the portal in the mini browser (the
 * <AuthProvider> wraps the whole page), so logging in or out here changes
 * what the portal's protected route allows.
 */
import { Link } from 'react-router-dom';
import { Lock, LockOpen } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';

export default function AuthStatus() {
  const { user, login, logout } = useAuth();

  return (
    <div className="stack">
      <p className={`alert ${user ? 'alert-success' : 'alert-warning'} m-0`} role="status">
        {user ? <LockOpen size={18} /> : <Lock size={18} />}
        {user ? `Logged in as ${user.name}.` : 'Logged out – /routing/admin will redirect to the login page.'}
      </p>
      <ol className="routing-steps">
        <li>
          While logged out, open <Link to="/routing/admin">/routing/admin</Link>. You land on the login page instead.
        </li>
        <li>Log in there: you are sent back to the admin page you asked for.</li>
        <li>Press the mini browser’s Back button: you skip the login page, because both redirects used replace.</li>
      </ol>
      <div className="row">
        {user ? (
          <button type="button" className="btn btn-sm" onClick={logout}>
            Log out
          </button>
        ) : (
          <button type="button" className="btn btn-sm" onClick={() => login('Demo Tutor')}>
            Log in as “Demo Tutor”
          </button>
        )}
      </div>
    </div>
  );
}
