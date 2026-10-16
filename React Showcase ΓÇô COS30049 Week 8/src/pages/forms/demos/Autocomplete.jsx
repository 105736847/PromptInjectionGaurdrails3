import { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import styles from './Autocomplete.module.css';

/**
 * Autocomplete (combobox) with full keyboard support: ↑ ↓ Enter Esc.
 *
 * - The results are DERIVED from the query during render – no extra state.
 * - The highlighted row is tracked by index (activeIndex). Focus stays in
 *   the input; aria-activedescendant tells screen readers which option is active.
 * - onMouseDown + preventDefault on an option stops the input from losing
 *   focus (blur) before the click registers.
 */
const UNITS = [
  { code: 'COS10009', name: 'Introduction to Programming' },
  { code: 'COS10026', name: 'Computing Technology Inquiry Project' },
  { code: 'COS20007', name: 'Object Oriented Programming' },
  { code: 'COS20015', name: 'Fundamentals of Data Management' },
  { code: 'COS20019', name: 'Cloud Computing Architecture' },
  { code: 'COS30008', name: 'Data Structures and Patterns' },
  { code: 'COS30019', name: 'Introduction to Artificial Intelligence' },
  { code: 'COS30043', name: 'Interface Design and Development' },
  { code: 'COS30045', name: 'Data Visualisation' },
  { code: 'COS30049', name: 'Computing Technology Innovation Project' },
  { code: 'COS30082', name: 'Applied Machine Learning' },
  { code: 'SWE20001', name: 'Development Project 1: Tools and Practices' },
  { code: 'SWE30003', name: 'Software Architectures and Design' },
  { code: 'INF30029', name: 'Information Technology Project Management' },
  { code: 'TNE10006', name: 'Networks and Switching' },
];

// Wrap the first match of `query` inside `text` in a <mark>.
function Highlight({ text, query }) {
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

export default function Autocomplete() {
  const id = useId();
  const listRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState(null);

  const q = query.trim();
  const results = UNITS.filter((u) => `${u.code} ${u.name}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  const showList = open && q.length > 0;

  // Keep the active option visible when arrowing through a scrolling list.
  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function choose(unit) {
    setSelected(unit);
    setQuery(unit.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event) {
    const arrow = event.key === 'ArrowDown' || event.key === 'ArrowUp';
    if (arrow && results.length === 0) return; // nothing to move through
    if (event.key === 'ArrowDown') {
      event.preventDefault(); // don't move the text cursor
      setOpen(true);
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === 'Enter' && showList && results[activeIndex]) {
      event.preventDefault();
      choose(results[activeIndex]);
    } else if (event.key === 'Escape') {
      if (showList) setOpen(false); // first Esc closes the list…
      else setQuery(''); // …second Esc clears the text
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 520 }}>
      <label className="label" htmlFor={id}>Search units</label>
      <div className={styles.wrap}>
        <Search size={16} className={styles.icon} aria-hidden="true" />
        <input
          id={id}
          className={`input ${styles.input}`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList && activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder="Try “data”, “COS30” or “project”"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        {showList && (
          <ul ref={listRef} id={`${id}-list`} role="listbox" className={styles.list} aria-label="Matching units">
            {results.length === 0 && <li className={styles.empty}>No units match “{q}”</li>}
            {results.map((unit, index) => (
              <li
                key={unit.code}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`${styles.option} ${index === activeIndex ? styles.active : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(unit)}
              >
                <span className="mono small"><Highlight text={unit.code} query={q} /></span>
                <span><Highlight text={unit.name} query={q} /></span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="hint m-0">
        <kbd>↑</kbd> <kbd>↓</kbd> move · <kbd>Enter</kbd> select · <kbd>Esc</kbd> close / clear · {results.length} match(es)
      </p>
      {selected && (
        <div className="alert alert-success">
          Selected <strong>{selected.code}</strong> {selected.name}
        </div>
      )}
    </div>
  );
}
