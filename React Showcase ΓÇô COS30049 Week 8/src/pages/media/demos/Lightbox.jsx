import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './Gallery.module.css';

/**
 * Lightbox – a full-screen image viewer (a modal dialog).
 *
 * - createPortal() renders it into <body>, outside the card, so no parent's
 *   `overflow: hidden` or z-index can clip it. Events still bubble through
 *   the REACT tree as if it were rendered in place.
 * - Focus management: focus moves into the dialog on open, Tab is trapped
 *   inside it, and focus returns to the thumbnail when it closes.
 * - Keys: ← → to navigate, Esc to close. Clicking the backdrop closes too.
 */
export default function Lightbox({ images, index, onClose, onNavigate }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const count = images.length;
  const image = images[index];

  const showPrevious = () => onNavigate((index - 1 + count) % count); // wrap around
  const showNext = () => onNavigate((index + 1) % count);

  // Runs once on open; the cleanup runs on close.
  useEffect(() => {
    const opener = document.activeElement; // the thumbnail button that was clicked
    closeRef.current.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // stop the page scrolling behind the modal
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  function handleKeyDown(event) {
    if (event.key === 'Escape') onClose();
    else if (event.key === 'ArrowLeft') showPrevious();
    else if (event.key === 'ArrowRight') showNext();
    else if (event.key === 'Tab') {
      // Focus trap: wrap from the last button to the first (and back with Shift+Tab)
      const buttons = dialogRef.current.querySelectorAll('button');
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  return createPortal(
    <div
      className={styles.backdrop}
      // Only a click on the backdrop itself closes – not clicks that bubble up from the image
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`Photo viewer: image ${index + 1} of ${count}`}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <button ref={closeRef} type="button" className={`${styles.navButton} ${styles.close}`} onClick={onClose} aria-label="Close viewer">
          <X size={22} />
        </button>
        <button type="button" className={`${styles.navButton} ${styles.prev}`} onClick={showPrevious} aria-label="Previous image">
          <ChevronLeft size={28} />
        </button>

        <figure className={styles.figure}>
          {/* key={src} → a fresh <img> per photo, so the old one never flashes */}
          <img key={image.src} src={image.src} alt={image.alt} className={styles.large} />
          <figcaption className={styles.caption}>
            <span>{image.caption}</span>
            <span aria-live="polite">{index + 1} / {count}</span>
          </figcaption>
        </figure>

        <button type="button" className={`${styles.navButton} ${styles.next}`} onClick={showNext} aria-label="Next image">
          <ChevronRight size={28} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
