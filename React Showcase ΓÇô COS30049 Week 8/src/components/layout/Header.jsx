import { Link } from 'react-router-dom';
import { Atom, Menu, Moon, Sun, X, BookOpen } from 'lucide-react';

import PageSearch from './PageSearch.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function Header({ sidebarOpen, onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className="app-header">
      <button
        type="button"
        className="btn-icon menu-button"
        onClick={onMenuClick}
        aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={sidebarOpen}
        aria-controls="app-sidebar"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* <Link> changes the URL without reloading the page (unlike a plain <a>) */}
      <Link to="/" className="brand">
        <span className="brand-logo">
          <Atom size={20} />
        </span>
        <span className="brand-text">
          React Showcase
          <small>Swinburne University of Technology · COS30049 · Week 8</small>
        </span>
      </Link>

      <div className="header-spacer" />

      <PageSearch />

      <div className="header-actions">
        <a
          className="btn-icon"
          href="https://react.dev/learn"
          target="_blank"
          rel="noreferrer"
          aria-label="Official React documentation"
          title="Official React docs"
        >
          <BookOpen size={19} />
        </a>
        <button
          type="button"
          className="btn-icon"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </div>
    </header>
  );
}
