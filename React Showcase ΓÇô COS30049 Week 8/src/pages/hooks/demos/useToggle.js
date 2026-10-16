import { useCallback, useState } from 'react';

/**
 * useToggle – a boolean with a ready-made "flip it" function.
 *
 *   const [isOpen, toggleOpen, setOpen] = useToggle(false);
 *   <button onClick={toggleOpen}>…</button>
 *
 * Tiny, but it removes the same three lines from every component that has
 * a show/hide switch. It returns an array (like useState) so callers can
 * name the values whatever they like.
 */
export default function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  // useCallback: the same function every render, safe to pass to memo'd children.
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}
