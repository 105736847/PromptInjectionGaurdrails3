/**
 * CustomSelect – a styled replacement for <select> (WAI-ARIA "select-only combobox").
 *
 * - Focus STAYS on the button. aria-activedescendant tells screen readers which
 *   option is highlighted, so we never move DOM focus into the list.
 * - Keyboard: ↓ / ↑ / Home / End move, Enter or Space picks, Esc cancels,
 *   typing a letter jumps to the next option that starts with it.
 * - Clicking elsewhere blurs the button, and onBlur closes the list.
 *   (Compare with DropdownMenu.jsx, which uses a document listener instead.)
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import styles from './CustomSelect.module.css';

const OPTIONS = [
  { value: 'mon-0830', label: 'Mon 08:30 · EN508', seats: 6 },
  { value: 'tue-1030', label: 'Tue 10:30 · ATC325', seats: 0 },
  { value: 'wed-1230', label: 'Wed 12:30 · BA403', seats: 2 },
  { value: 'thu-1430', label: 'Thu 14:30 · EN310', seats: 11 },
  { value: 'fri-0930', label: 'Fri 09:30 · Online', seats: 25 },
];
const isDisabled = (option) => option.seats === 0; // full classes cannot be chosen

// Find the next enabled option in a direction (+1 or -1), without wrapping.
function nextEnabled(start, step) {
  for (let i = start + step; i >= 0 && i < OPTIONS.length; i += step) {
    if (!isDisabled(OPTIONS[i])) return i;
  }
  return start;
}

export default function CustomSelect() {
  const [value, setValue] = useState(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const id = useId();

  const selectedIndex = OPTIONS.findIndex((option) => option.value === value);
  const selected = OPTIONS[selectedIndex];

  // Keep the highlighted option visible when the list scrolls.
  useEffect(() => {
    if (open) listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  function openList() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : nextEnabled(-1, 1));
    setOpen(true);
  }

  function pick(index) {
    setValue(OPTIONS[index].value);
    setOpen(false);
  }

  function handleKeyDown(event) {
    const { key } = event;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    const actions = {
      ArrowDown: () => setActiveIndex((i) => nextEnabled(i, 1)),
      ArrowUp: () => setActiveIndex((i) => nextEnabled(i, -1)),
      Home: () => setActiveIndex(nextEnabled(-1, 1)),
      End: () => setActiveIndex(nextEnabled(OPTIONS.length, -1)),
      Enter: () => pick(activeIndex),
      ' ': () => pick(activeIndex),
      Escape: () => setOpen(false),
    };
    if (actions[key]) {
      event.preventDefault();
      actions[key]();
    } else if (key.length === 1) {
      // Type-ahead: jump to the first enabled option starting with that letter.
      const match = OPTIONS.findIndex((o) => !isDisabled(o) && o.label.toLowerCase().startsWith(key.toLowerCase()));
      if (match >= 0) setActiveIndex(match);
    }
    // Any other key (e.g. Tab) keeps its normal behaviour – onBlur then closes the list.
  }

  return (
    <div className={styles.demo}>
      <div className={styles.field}>
        <span id={`${id}-label`} className="label">Tutorial class</span>
        <button
          type="button"
          role="combobox"
          className={styles.trigger}
          aria-labelledby={`${id}-label`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={handleKeyDown}
          onBlur={() => setOpen(false)}
        >
          <span className={selected ? undefined : styles.placeholder}>{selected?.label ?? 'Choose a class…'}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>

        {open && (
          // preventDefault on mousedown keeps focus on the button while clicking an option
          <ul ref={listRef} role="listbox" id={`${id}-listbox`} aria-labelledby={`${id}-label`} className={styles.listbox} onMouseDown={(event) => event.preventDefault()}>
            {OPTIONS.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={isDisabled(option)}
                data-active={index === activeIndex}
                className={styles.option}
                onClick={() => !isDisabled(option) && pick(index)}
                onMouseEnter={() => !isDisabled(option) && setActiveIndex(index)}
              >
                <span>{option.label}</span>
                <span className={styles.seats}>{isDisabled(option) ? 'Full' : `${option.seats} seats`}</span>
                {option.value === value && <Check size={16} aria-hidden="true" />}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* For comparison: the native element gives you all of this for free. */}
      <label className="field">
        <span className="label">Native &lt;select&gt; (for comparison)</span>
        <select className="input" value={value ?? ''} onChange={(event) => setValue(event.target.value || null)}>
          <option value="">Choose a class…</option>
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value} disabled={isDisabled(option)}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
