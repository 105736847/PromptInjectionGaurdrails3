/**
 * Modal – a reusable dialog component.
 *
 *   <Modal open={isOpen} onClose={() => setOpen(false)} title="Hello" footer={<button>OK</button>}>
 *     Body content
 *   </Modal>
 *
 * - createPortal renders the dialog into <body>, so no parent's `overflow: hidden`
 *   or z-index can clip it – even though it is written INSIDE our component tree.
 * - useFocusTrap moves focus in, keeps Tab inside, and returns focus on close.
 * - Esc and a click on the backdrop call onClose. The page behind can't scroll.
 * - role="dialog" + aria-modal + aria-labelledby tell screen readers what this is.
 */
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useFocusTrap from './useFocusTrap.js';
import styles from './Modal.module.css';

export default function Modal({ open, onClose, title, children, footer, size = 'md', role = 'dialog' }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);

    // Lock page scrolling; remember the old value so we can restore it exactly.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null; // closed → render nothing at all

  return createPortal(
    <div
      className={styles.backdrop}
      // mousedown (not click) so that selecting text inside and releasing outside doesn't close it
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={size === 'sm' ? `${styles.dialog} ${styles.sm}` : styles.dialog}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
