import { NavLink } from 'react-router-dom';
import { navSections } from '../../data/navigation.js';

/**
 * Sidebar – the main navigation, generated from the navSections data.
 * <NavLink> is like <Link> but knows whether it matches the current URL,
 * so we can highlight the active page.
 */
export default function Sidebar({ open, onNavigate }) {
  return (
    <aside id="app-sidebar" className={`app-sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
      <nav>
        {navSections.map((section) => (
          <div key={section.heading} className="nav-section">
            <h2 className="nav-heading">{section.heading}</h2>
            <ul className="nav-list">
              {section.items.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === '/'} // "/" should only be active on the home page itself
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    onClick={onNavigate}
                  >
                    <Icon size={17} aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
