/**
 * PageSearch – a small "command palette" in the header.
 * Type to filter pages, use ↑ ↓ to move, Enter to open, Esc to close.
 * Press "/" anywhere on the page to jump into the search box.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import { allPages } from '../../data/navigation.js';

export default function PageSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const listId = useId();

  // Derived data: calculated from state during render – no extra state needed.
  const q = query.trim().toLowerCase();
  const results = q
    ? allPages.filter(
        (page) => page.label.toLowerCase().includes(q) || page.description.toLowerCase().includes(q),
      )
    : allPages;

  // Global keyboard shortcut: "/" focuses the search box.
  useEffect(() => {
    function onKeyDown(event) {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function goTo(page) {
    navigate(page.path);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      goTo(results[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="page-search" role="search">
      <Search size={16} className="page-search-icon" aria-hidden="true" />
      <input
        ref={inputRef}
        className="input"
        type="search"
        placeholder="Search topics…"
        aria-label="Search topics"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Delay closing so a click on a result is registered first.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
      />
      {!open && <kbd className="page-search-kbd">/</kbd>}

      {open && (
        <ul className="page-search-results" id={listId} role="listbox">
          {results.length === 0 && <li className="page-search-empty">No topics match “{query}”.</li>}
          {results.map((page, index) => {
            const Icon = page.icon;
            return (
              <li key={page.path} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goTo(page)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <Icon size={17} style={{ marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
                  <div>
                    {page.label}
                    <span>{page.description}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
