/**
 * Popover – click to open a small panel that can contain interactive content.
 *
 * Tooltip vs popover:
 * - Tooltip: plain text, appears on hover/focus, nothing inside can be clicked.
 * - Popover: opens on CLICK, may contain links and buttons, stays open until
 *   you click outside it, press Esc, or click the trigger again.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { CalendarClock, ChevronDown, Mail, UserRound } from 'lucide-react';
import styles from './Popover.module.css';

export default function Popover() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      // Clicks inside the wrapper (trigger or panel) are ignored.
      if (!wrapperRef.current.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.demo}>
      <div ref={wrapperRef} className={styles.wrapper}>
        <button
          ref={triggerRef}
          type="button"
          className="btn"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
        >
          <UserRound size={16} aria-hidden="true" /> Your tutor <ChevronDown size={14} aria-hidden="true" />
        </button>

        {open && (
          <div id={id} role="dialog" aria-label="Tutor contact details" className={styles.popover}>
            <div className="row">
              <span className="avatar">MC</span>
              <div>
                <strong>Dr Maya Chen</strong>
                <div className="small muted">Tutor · COS30049 · Lab 3</div>
              </div>
            </div>
            <p className="small m-0">
              <CalendarClock size={14} aria-hidden="true" /> Consultation: Fri 12:00–13:00, room EN508
            </p>
            <div className="row">
              <a className="btn btn-sm btn-primary" href="mailto:maya.chen@example.edu">
                <Mail size={14} aria-hidden="true" /> Email
              </a>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current.focus(); // don't leave keyboard users stranded
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="small muted m-0">Open it, then try: Tab into the panel, Esc, or click anywhere outside.</p>
    </div>
  );
}
