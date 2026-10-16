/**
 * Breadcrumbs – "Portal › Students › Mia Chen", built from the current URL.
 *
 * Split location.pathname into segments; every segment becomes a link to the
 * path up to that point. The last crumb is the current page (no link).
 */
import { Link, useLocation } from 'react-router-dom';
import { getStudentById } from '../../../data/students.js';

const LABELS = { routing: 'Portal', students: 'Students', admin: 'Admin', login: 'Log in' };

function labelFor(segment, previousSegment) {
  if (previousSegment === 'students') {
    const student = getStudentById(segment);
    return student ? `${student.firstName} ${student.lastName}` : `#${segment}`;
  }
  return LABELS[segment] ?? safeDecode(segment);
}

// "%20" → " ". decodeURIComponent throws on broken input like "%E0", so be careful.
function safeDecode(text) {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean); // "/routing/students/3" → ['routing', 'students', '3']

  const crumbs = segments.map((segment, i) => ({
    path: `/${segments.slice(0, i + 1).join('/')}`,
    label: labelFor(segment, segments[i - 1]),
  }));

  return (
    <nav aria-label="Breadcrumb">
      <ol className="routing-crumbs">
        {crumbs.map((crumb, i) => (
          <li key={crumb.path}>
            {i === crumbs.length - 1 ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.path}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
