/**
 * MiniBrowser – a fake browser window around the student portal.
 *
 * The address bar shows the REAL URL (useLocation) – look at your browser's
 * own address bar too: they always match. Back/Forward call navigate(-1) and
 * navigate(1), which move through the real browser history.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Globe } from 'lucide-react';
import StudentRoutes from './StudentRoutes.jsx';

// Handy URLs to try. Plain data → rendered with map().
const BOOKMARKS = [
  { label: 'Directory', to: '/routing' },
  { label: 'Filtered (?major&q)', to: '/routing?major=Data+Science&q=a' },
  { label: 'Student #3', to: '/routing/students/3' },
  { label: 'Bad id', to: '/routing/students/999' },
  { label: 'Old URL (redirect)', to: '/routing/old-directory' },
  { label: 'Admin (protected)', to: '/routing/admin' },
  { label: 'Typo (404)', to: '/routing/teachers' },
];

/** The editable address bar. It keeps a draft while you type. */
function AddressBar({ address }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(address);

  function handleSubmit(event) {
    event.preventDefault();
    const target = draft.trim();
    navigate(target.startsWith('/') ? target : `/routing/${target}`);
  }

  return (
    <form className="routing-address" onSubmit={handleSubmit}>
      <Globe size={14} aria-hidden="true" />
      <input
        aria-label="Address"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
      />
    </form>
  );
}

export default function MiniBrowser() {
  const location = useLocation();
  const navigate = useNavigate();
  const address = location.pathname + location.search;

  return (
    <div className="routing-browser">
      <div className="routing-browser-bar">
        <span className="routing-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <button type="button" className="btn-icon" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        <button type="button" className="btn-icon" onClick={() => navigate(1)} aria-label="Forward">
          <ArrowRight size={16} />
        </button>
        {/* key={address}: when the URL changes, React throws away the old AddressBar
            (and its draft) and mounts a fresh one showing the new address. */}
        <AddressBar key={address} address={address} />
      </div>

      <nav className="routing-bookmarks" aria-label="Bookmarks">
        {BOOKMARKS.map((bookmark) => (
          <Link key={bookmark.to} to={bookmark.to}>
            {bookmark.label}
          </Link>
        ))}
      </nav>

      <div className="routing-viewport">
        <StudentRoutes />
      </div>
    </div>
  );
}
