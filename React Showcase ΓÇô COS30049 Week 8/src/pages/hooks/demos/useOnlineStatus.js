import { useEffect, useState } from 'react';

/**
 * useOnlineStatus – true while the browser has a network connection.
 *
 *   const isOnline = useOnlineStatus();
 *
 * It subscribes to the window's "online" / "offline" events and removes the
 * listeners again in the cleanup. (react.dev shows an alternative version
 * using useSyncExternalStore – same idea, built for external stores.)
 *
 * Test it: DevTools → Network tab → change "No throttling" to "Offline".
 */
export default function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
