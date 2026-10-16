import { useEffect, useState } from 'react';

/**
 * useMediaQuery – returns true/false for any CSS media query and re-renders
 * the component ONLY when that answer changes.
 *
 *   const isDesktop = useMediaQuery('(min-width: 900px)');
 *   const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * window.matchMedia() is the JavaScript twin of an @media rule in CSS.
 */
export default function useMediaQuery(query) {
  // Lazy initial state: read the real answer on the very first render.
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event) => setMatches(event.matches);

    setMatches(mediaQueryList.matches); // the query string itself may have changed
    // 'change' only fires when the query flips between true and false,
    // not on every pixel of resizing like the window 'resize' event.
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
