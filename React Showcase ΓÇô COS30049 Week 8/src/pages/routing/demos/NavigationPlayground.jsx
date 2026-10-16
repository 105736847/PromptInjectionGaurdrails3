/**
 * NavigationPlayground – what the router hooks return, live.
 *
 * Each button calls navigate() with different options. Watch the values:
 * - push (default) adds a history entry; { replace: true } overwrites it,
 *   so history.length does not grow.
 * - { state } attaches invisible data to the entry (it's not in the URL).
 * - This component sits OUTSIDE the portal's <Routes>, so useParams() only
 *   sees the "*" part matched by App.jsx. useMatch() can still read the id.
 */
import { useLocation, useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom';

export default function NavigationPlayground() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const studentMatch = useMatch('/routing/students/:studentId');

  const rows = [
    ['location.pathname', location.pathname],
    ['location.search', location.search || '(empty)'],
    ['location.state', JSON.stringify(location.state)],
    ['location.key', location.key],
    ['useParams()', JSON.stringify(params)],
    ["useMatch('/routing/students/:studentId')?.params", JSON.stringify(studentMatch?.params ?? null)],
    ['Object.fromEntries(searchParams)', JSON.stringify(Object.fromEntries(searchParams))],
    ['window.history.length', window.history.length],
  ];

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn btn-sm" onClick={() => navigate('/routing/students/5')}>
          Push /students/5
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => navigate('/routing/students/6', { replace: true })}
        >
          Replace with /students/6
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => navigate('/routing/students/7', { state: { note: 'Hello from the playground! (location.state)' } })}
        >
          Go to /students/7 with state
        </button>
        <button type="button" className="btn btn-sm" onClick={() => navigate('/routing?major=Cybersecurity')}>
          With a query string
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate(-1)}>
          navigate(-1)
        </button>
      </div>

      <div className="table-wrap">
        <table className="table routing-inspector">
          <thead>
            <tr>
              <th scope="col">Expression</th>
              <th scope="col">Current value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row" className="mono small">
                  {label}
                </th>
                <td className="mono small">{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
