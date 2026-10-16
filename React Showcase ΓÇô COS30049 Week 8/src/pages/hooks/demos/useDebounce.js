import { useEffect, useState } from 'react';

/**
 * useDebounce – returns `value`, but only after it has stopped changing
 * for `delay` milliseconds.
 *
 *   const debouncedQuery = useDebounce(query, 400);
 *
 * Perfect for search boxes: filter (or call your API) once the user pauses
 * typing, instead of on every single keystroke.
 */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delay);
    // A new keystroke changes `value` → this cleanup cancels the previous timer.
    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debounced;
}
