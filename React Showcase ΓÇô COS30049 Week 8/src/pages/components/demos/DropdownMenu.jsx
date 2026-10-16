/**
 * DropdownMenu – an "Actions" menu (WAI-ARIA menu button pattern).
 *
 * - useRef + a document "pointerdown" listener closes the menu when you click
 *   anywhere else. The listener is only attached while the menu is open and is
 *   removed again in the effect's cleanup function.
 * - Keyboard: ↓ / ↑ / Home / End move between items, Esc closes and gives focus
 *   back to the button, Tab closes and lets focus move on.
 * - Focus follows state: activeIndex lives in state, an effect moves DOM focus.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Copy, Download, FileText, Pencil, Trash2 } from 'lucide-react';
import styles from './DropdownMenu.module.css';

const ITEMS = [
  { id: 'open', label: 'Open submission', icon: FileText },
  { id: 'rename', label: 'Rename', icon: Pencil },
  { id: 'duplicate', label: 'Duplicate', icon: Copy },
  { id: 'download', label: 'Download PDF', icon: Download },
  { id: 'divider-1', divider: true },
  { id: 'delete', label: 'Delete submission', icon: Trash2, danger: true },
];
const ACTIONS = ITEMS.filter((item) => !item.divider); // the focusable items only

export default function DropdownMenu() {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastChoice, setLastChoice] = useState(null);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const itemRefs = useRef([]);
  const id = useId();

  // 1. Click outside → close. Only listen while open; always clean up.
  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(event) {
      if (!wrapperRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  // 2. Whenever the menu is open, DOM focus follows the activeIndex state.
  useEffect(() => {
    if (open) itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function openAt(index) {
    setActiveIndex(index);
    setOpen(true);
  }

  function close({ returnFocus = true } = {}) {
    setOpen(false);
    if (returnFocus) buttonRef.current.focus();
  }

  function handleButtonKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(event.key === 'ArrowDown' ? 0 : ACTIONS.length - 1);
    }
  }

  function handleMenuKeyDown(event) {
    const last = ACTIONS.length - 1;
    const moves = {
      ArrowDown: () => setActiveIndex((i) => (i === last ? 0 : i + 1)),
      ArrowUp: () => setActiveIndex((i) => (i === 0 ? last : i - 1)),
      Home: () => setActiveIndex(0),
      End: () => setActiveIndex(last),
      Escape: () => close(),
    };
    if (moves[event.key]) {
      event.preventDefault();
      moves[event.key]();
    } else if (event.key === 'Tab') {
      close({ returnFocus: false });
    }
  }

  function choose(item) {
    setLastChoice(item.label);
    close();
  }

  return (
    <div className={styles.demo}>
      <div ref={wrapperRef} className={styles.wrapper}>
        <button
          ref={buttonRef}
          type="button"
          id={`${id}-button`}
          className="btn"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={`${id}-menu`}
          onClick={() => (open ? close() : openAt(0))}
          onKeyDown={handleButtonKeyDown}
        >
          Assignment 3 actions <ChevronDown size={16} aria-hidden="true" />
        </button>

        {open && (
          <ul role="menu" id={`${id}-menu`} aria-labelledby={`${id}-button`} className={styles.menu} onKeyDown={handleMenuKeyDown}>
            {ITEMS.map((item) => {
              if (item.divider) return <li key={item.id} role="separator" className={styles.divider} />;
              const index = ACTIONS.indexOf(item);
              const Icon = item.icon;
              return (
                <li key={item.id} role="none">
                  <button
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    type="button"
                    role="menuitem"
                    tabIndex={index === activeIndex ? 0 : -1}
                    className={item.danger ? `${styles.item} ${styles.danger}` : styles.item}
                    onClick={() => choose(item)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="small muted m-0" aria-live="polite">
        {lastChoice ? `You chose: ${lastChoice}` : 'Tip: focus the button and press ↓ to open the menu with the keyboard.'}
      </p>
    </div>
  );
}
