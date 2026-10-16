/**
 * ContextMenu – a custom right-click menu on a file card.
 *
 * - onContextMenu + event.preventDefault() replaces the browser's own menu.
 * - The menu is rendered with createPortal and `position: fixed` at the cursor
 *   (clientX / clientY). useLayoutEffect measures it BEFORE the browser paints
 *   and nudges it back inside the window if it would overflow.
 * - It closes on: a click outside, Esc (focus returns to the card), scroll or resize.
 * - Keyboard users: focus the card and press Shift+F10 or the Menu key.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileText, Link, Pencil, Star, Trash2 } from 'lucide-react';
import styles from './ContextMenu.module.css';

const ACTIONS = [
  { id: 'open', label: 'Open', icon: FileText },
  { id: 'download', label: 'Download', icon: Download },
  { id: 'copy-link', label: 'Copy link', icon: Link },
  { id: 'rename', label: 'Rename', icon: Pencil },
  { id: 'favourite', label: 'Add to favourites', icon: Star },
  { id: 'delete', label: 'Delete', icon: Trash2, danger: true },
];

export default function ContextMenu() {
  const [menu, setMenu] = useState(null); // { x, y } or null
  const [lastAction, setLastAction] = useState(null);
  const menuRef = useRef(null);
  const cardRef = useRef(null);
  const hintId = useId();
  const isOpen = menu !== null;

  function handleContextMenu(event) {
    event.preventDefault(); // no browser menu
    let { clientX: x, clientY: y } = event;
    if (x === 0 && y === 0) {
      // Opened from the keyboard: there is no pointer position, so use the card's corner.
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left + 24;
      y = rect.top + 24;
    }
    setMenu({ x, y });
  }

  // Measure before paint, then keep the menu inside the viewport.
  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return;
    const { width, height } = menuRef.current.getBoundingClientRect();
    const x = Math.min(menu.x, window.innerWidth - width - 8);
    const y = Math.min(menu.y, window.innerHeight - height - 8);
    if (x !== menu.x || y !== menu.y) setMenu({ x, y }); // runs at most twice
  }, [menu]);

  // While open: focus the first item and listen for the ways to close.
  useEffect(() => {
    if (!isOpen) return undefined;
    menuRef.current?.querySelector('button')?.focus();

    const close = () => setMenu(null);
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) close();
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        close();
        cardRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', close, true); // capture: also catches scrolling inside other elements
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);

  function handleMenuKeyDown(event) {
    if (event.key === 'Tab') setMenu(null); // tabbing away closes the menu
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
    const current = items.indexOf(document.activeElement);
    const next = event.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
    items[next].focus();
  }

  function choose(action) {
    setLastAction(action.label);
    setMenu(null);
    cardRef.current?.focus();
    if (action.id === 'copy-link') navigator.clipboard?.writeText('https://example.edu/files/assignment3-brief.pdf').catch(() => {});
  }

  return (
    <div className="stack">
      <div
        ref={cardRef}
        className={styles.card}
        tabIndex={0}
        onContextMenu={handleContextMenu}
        aria-describedby={hintId}
      >
        <FileText size={32} aria-hidden="true" />
        <div>
          <strong>Assignment 3 brief.pdf</strong>
          <div className="small muted">1.8 MB · updated 2 days ago</div>
        </div>
      </div>
      <p id={hintId} className="small muted m-0">
        Right-click the card (or focus it and press Shift+F10).{' '}
        <span aria-live="polite">{lastAction && <>Last action: <strong>{lastAction}</strong></>}</span>
      </p>

      {isOpen &&
        createPortal(
          <ul
            ref={menuRef}
            role="menu"
            aria-label="File actions"
            className={styles.menu}
            style={{ left: menu.x, top: menu.y }}
            onKeyDown={handleMenuKeyDown}
            onContextMenu={(event) => event.preventDefault()}
          >
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.id} role="none">
                  {action.danger && <hr className={styles.divider} />}
                  <button type="button" role="menuitem" className={action.danger ? `${styles.item} ${styles.danger}` : styles.item} onClick={() => choose(action)}>
                    <Icon size={15} aria-hidden="true" /> {action.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
