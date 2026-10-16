/**
 * Drawer – a side sheet that slides in from the right.
 *
 * Unlike Modal.jsx, the drawer stays MOUNTED when closed, so CSS can animate it
 * both in AND out. While closed it is `inert`: not focusable, not clickable and
 * hidden from screen readers.
 */
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useFocusTrap from './useFocusTrap.js';
import styles from './Drawer.module.css';

export default function Drawer({ open, onClose, title, children, footer }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => event.key === 'Escape' && onClose();
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return createPortal(
    <div className={styles.root} data-open={open} inert={!open}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={styles.panel}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close panel">
            <X size={18} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}
