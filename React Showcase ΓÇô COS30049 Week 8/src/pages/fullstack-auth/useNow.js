import { useEffect, useState } from 'react';

/**
 * useNow(intervalMs) – the current time (Date.now()), refreshed every `intervalMs`.
 * Countdowns derive "seconds left" from it during render – no extra state needed.
 */
export default function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id); // cleanup: stop the timer when the component unmounts
  }, [intervalMs]);

  return now;
}
