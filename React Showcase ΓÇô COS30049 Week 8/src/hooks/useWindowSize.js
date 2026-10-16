import { useEffect, useState } from 'react';

/**
 * useWindowSize – returns the current browser window size and re-renders
 * the component whenever the window is resized.
 *
 *   const { width, height } = useWindowSize();
 */
export default function useWindowSize() {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    // Always remove event listeners you add, otherwise they leak.
    return () => window.removeEventListener('resize', handleResize);
  }, []); // [] → run once after the first render

  return size;
}
