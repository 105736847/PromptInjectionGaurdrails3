/**
 * ResponsiveNavbar – logo, links and a hamburger menu for small screens.
 *
 * - The layout switch is done in CSS with a CONTAINER QUERY: the navbar reacts
 *   to the width of its own box, not the whole window. That is why the
 *   "Mobile" preview works even on a wide desktop screen.
 * - React only stores whether the mobile menu is open (menuOpen) and which
 *   link is active. The hamburger button uses aria-expanded + aria-controls.
 */
import { useId, useRef, useState } from 'react';
import { Bell, GraduationCap, Menu, Monitor, Smartphone, X } from 'lucide-react';
import styles from './ResponsiveNavbar.module.css';

const LINKS = ['Dashboard', 'Units', 'Timetable', 'Grades', 'Library'];

export default function ResponsiveNavbar() {
  const [preview, setPreview] = useState('desktop'); // 'desktop' | 'mobile'
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('Dashboard');
  const burgerRef = useRef(null);
  const menuId = useId();

  function navigate(event, link) {
    event.preventDefault(); // in a real app this would be a React Router <NavLink>
    setActive(link);
    setMenuOpen(false);
  }

  function handleMenuKeyDown(event) {
    if (event.key === 'Escape') {
      setMenuOpen(false);
      burgerRef.current.focus(); // give focus back to the button that opened the menu
    }
  }

  const renderLinks = () =>
    LINKS.map((link) => (
      <li key={link}>
        <a href={`#${link.toLowerCase()}`} aria-current={link === active ? 'page' : undefined} onClick={(event) => navigate(event, link)}>
          {link}
        </a>
      </li>
    ));

  return (
    <div className="stack">
      <div className="btn-group" role="group" aria-label="Preview width">
        <button type="button" className={`btn btn-sm ${preview === 'desktop' ? 'active' : ''}`} aria-pressed={preview === 'desktop'} onClick={() => setPreview('desktop')}>
          <Monitor size={15} aria-hidden="true" /> Desktop
        </button>
        <button type="button" className={`btn btn-sm ${preview === 'mobile' ? 'active' : ''}`} aria-pressed={preview === 'mobile'} onClick={() => setPreview('mobile')}>
          <Smartphone size={15} aria-hidden="true" /> Mobile
        </button>
      </div>

      {/* The frame is the "container" the CSS container query measures. */}
      <div className={styles.frame} data-preview={preview}>
        <header className={styles.navbar}>
          <a href="#dashboard" className={styles.logo} onClick={(event) => navigate(event, 'Dashboard')}>
            <GraduationCap size={22} aria-hidden="true" /> Campus<strong>Hub</strong>
          </a>

          <nav aria-label="Main" className={styles.desktopNav}>
            <ul>{renderLinks()}</ul>
          </nav>

          <div className={styles.actions}>
            <button type="button" className="btn-icon" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <span className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }} aria-hidden="true">
              AK
            </span>
            <button
              ref={burgerRef}
              type="button"
              className={`btn-icon ${styles.burger}`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {menuOpen && (
          <nav id={menuId} aria-label="Main (mobile)" className={styles.mobileNav} onKeyDown={handleMenuKeyDown}>
            <ul>{renderLinks()}</ul>
          </nav>
        )}

        <div className={styles.body}>
          <h4 className="m-0">{active}</h4>
          <p className="small muted m-0">Page content goes here. Switch to “Mobile” and open the ☰ menu.</p>
        </div>
      </div>
    </div>
  );
}
