/**
 * LoginPage – after "logging in", go back to the page the user originally
 * asked for. RequireAuth put that location into `location.state.from`.
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('Demo Tutor');

  // Where to go after logging in (fall back to the admin page).
  const from = location.state?.from?.pathname ?? '/routing/admin';

  function handleSubmit(event) {
    event.preventDefault();
    login(name.trim() || 'Demo Tutor');
    navigate(from, { replace: true }); // replace: "Back" shouldn't return to the login form
  }

  return (
    <section className="stack">
      <h4 className="m-0">Log in</h4>
      {location.state?.from && (
        <p className="alert alert-info m-0">
          <LogIn size={18} /> You need to log in to see <code>{location.state.from.pathname}</code>.
        </p>
      )}
      {user && <p className="small muted m-0">You are already logged in as {user.name}.</p>}
      <form className="row" onSubmit={handleSubmit}>
        <label htmlFor="routing-login-name" className="visually-hidden">
          Your name
        </label>
        <input
          id="routing-login-name"
          className="input routing-login-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary">
          Log in
        </button>
      </form>
      <p className="small muted m-0">This is a pretend login – no password, nothing is sent anywhere.</p>
    </section>
  );
}
