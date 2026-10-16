/**
 * NavLinkDemo – <NavLink> is a <Link> that knows whether it matches the URL.
 *
 * - className / style / children can be FUNCTIONS that receive { isActive }.
 * - The active link automatically gets aria-current="page" for screen readers.
 * - `end` means "only match this exact path", not the paths below it.
 * The app's own sidebar (components/layout/Sidebar.jsx) works exactly like this.
 */
import { NavLink } from 'react-router-dom';
import { Check } from 'lucide-react';

const LINKS = [
  { to: '/routing', label: 'Directory' },
  { to: '/routing/students/1', label: 'Student 1' },
  { to: '/routing/students/2', label: 'Student 2' },
  { to: '/routing/admin', label: 'Admin' },
];

function LinkRow({ useEnd }) {
  return (
    <nav className="routing-pills" aria-label={useEnd ? 'With end' : 'Without end'}>
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={useEnd}
          className={({ isActive }) => `routing-pill${isActive ? ' active' : ''}`}
        >
          {/* children as a function: show a tick only on the active link */}
          {({ isActive }) => (
            <>
              {isActive && <Check size={14} aria-hidden="true" />}
              {link.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function NavLinkDemo() {
  return (
    <div className="stack">
      <div className="stack-sm">
        <span className="small muted">
          Without <code>end</code> – “Directory” (/routing) stays active on every page below it:
        </span>
        <LinkRow useEnd={false} />
      </div>
      <div className="stack-sm">
        <span className="small muted">
          With <code>end</code> – each link is only active on its exact URL:
        </span>
        <LinkRow useEnd />
      </div>
    </div>
  );
}
