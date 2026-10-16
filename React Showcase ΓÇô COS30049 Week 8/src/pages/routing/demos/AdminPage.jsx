/**
 * AdminPage – only reachable through <RequireAuth>, so `user` is always set.
 */
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { students } from '../../../data/students.js';
import { useAuth } from './AuthContext.jsx';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const atRisk = students.filter((s) => s.status === 'At risk');

  function handleLogout() {
    logout();
    navigate('/routing'); // leave the protected page
  }

  return (
    <section className="stack">
      <div className="row-between">
        <h4 className="m-0 row">
          <ShieldCheck size={18} aria-hidden="true" /> Tutor dashboard
        </h4>
        <button type="button" className="btn btn-sm" onClick={handleLogout}>
          <LogOut size={15} /> Log out
        </button>
      </div>
      <p className="m-0">
        Welcome, <strong>{user.name}</strong>. These students need a check-in this week:
      </p>
      <ul className="routing-link-list">
        {atRisk.map((s) => (
          <li key={s.id}>
            <Link to={`/routing/students/${s.id}`}>
              {s.firstName} {s.lastName}
            </Link>{' '}
            <span className="small muted">– score {s.score}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
