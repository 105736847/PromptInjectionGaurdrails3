import { Link, useLocation } from 'react-router-dom';
import { allPages } from '../../data/navigation.js';

/** PageNav – "Previous / Next" links at the bottom of each page. */
export default function PageNav() {
  const { pathname } = useLocation();
  const section = '/' + pathname.split('/')[1];
  const index = allPages.findIndex((page) => page.path === section);

  if (index === -1) return null; // e.g. on the 404 page

  const previous = allPages[index - 1];
  const next = allPages[index + 1];

  return (
    <nav className="page-nav" aria-label="Previous and next topic">
      {previous && (
        <Link to={previous.path}>
          <small>← Previous</small>
          {previous.label}
        </Link>
      )}
      {next && (
        <Link to={next.path} className="next">
          <small>Next →</small>
          {next.label}
        </Link>
      )}
    </nav>
  );
}
