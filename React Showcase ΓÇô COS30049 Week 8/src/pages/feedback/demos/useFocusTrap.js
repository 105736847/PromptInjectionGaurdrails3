import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * useFocusTrap – keeps keyboard focus inside `containerRef` while `active` is true.
 * Used by Modal.jsx and Drawer.jsx.
 *
 *   const ref = useRef(null);
 *   useFocusTrap(ref, isOpen);
 *   <div ref={ref} tabIndex={-1}>…</div>
 *
 * 1. Remembers which element had focus before (usually the button that opened the dialog).
 * 2. Moves focus inside: to the element marked data-autofocus, else the first focusable one.
 * 3. Wraps Tab / Shift+Tab around at the first and last focusable elements.
 * 4. Cleanup: gives focus back to the remembered element.
 */
export default function useFocusTrap(containerRef, active) {
  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return undefined;

    const previouslyFocused = document.activeElement;
    const getFocusable = () => [...container.querySelectorAll(FOCUSABLE)];

    const first = container.querySelector('[data-autofocus]') ?? getFocusable()[0] ?? container;
    first.focus();

    function handleKeyDown(event) {
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      const outside = !container.contains(document.activeElement);

      if (event.shiftKey && (document.activeElement === firstEl || outside)) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && (document.activeElement === lastEl || outside)) {
        event.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Only restore focus if that element is still on the page.
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [containerRef, active]);
}
