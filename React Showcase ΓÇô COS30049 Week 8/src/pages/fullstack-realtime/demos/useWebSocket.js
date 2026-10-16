/**
 * useWebSocket – a WebSocket that reconnects by itself, waiting longer after each failure.
 *
 *   const { status, send, retryIn, drop } = useWebSocket('/api/ws/training', { onMessage, onClose });
 *   // status: 'connecting' | 'open' | 'reconnecting'
 *
 * Why reconnect? Wi-Fi drops, laptops sleep, and `uvicorn --reload` restarts the server every
 * time you save a .py file. Why wait longer each time ("exponential backoff")? If the server is
 * down, a hundred open tabs retrying every 100 ms would flood it the moment it comes back.
 */
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { wsUrl } from '../../../api/client.js';

const delayFor = (attempt) => Math.min(10000, 500 * 2 ** attempt); // 0.5 s, 1 s, 2 s, 4 s … max 10 s

export default function useWebSocket(path, { onMessage, onClose } = {}) {
  const [status, setStatus] = useState('connecting');
  const [retryIn, setRetryIn] = useState(null); // seconds until the next attempt
  const socketRef = useRef(null);

  // Effect Events see the latest props without restarting the effect (no reconnect on re-render).
  const handleMessage = useEffectEvent((data) => onMessage?.(data));
  const handleClose = useEffectEvent(() => onClose?.());

  useEffect(() => {
    let socket;
    let timer;
    let attempt = 0;
    let unmounted = false;

    function connect() {
      socket = new WebSocket(wsUrl(path)); // ws://localhost:3000/api/ws/… – Vite forwards it to FastAPI
      socketRef.current = socket;
      socket.onopen = () => {
        attempt = 0;
        setStatus('open');
        setRetryIn(null);
      };
      socket.onmessage = (event) => handleMessage(JSON.parse(event.data));
      socket.onclose = () => {
        if (unmounted) return; // we closed it on purpose – don't reconnect
        handleClose();
        const delay = delayFor(attempt++);
        setStatus('reconnecting');
        setRetryIn(Math.round(delay / 100) / 10);
        timer = setTimeout(connect, delay);
      };
    }

    connect();
    return () => {
      unmounted = true;
      clearTimeout(timer);
      socketRef.current = null;
      socket.onmessage = null;
      // In development StrictMode unmounts once straight away. Closing a socket that is still
      // CONNECTING makes the browser log an error, so let it finish opening, then close it.
      if (socket.readyState === WebSocket.CONNECTING) socket.onopen = () => socket.close(1000);
      else socket.close(1000, 'Component unmounted');
    };
  }, [path]);

  // useCallback: a stable function, safe to pass to children or use in their effects.
  const send = useCallback((data) => {
    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(data));
    return true;
  }, []);

  // Close the connection as if the network had dropped – to watch the reconnect logic work.
  const drop = useCallback(() => socketRef.current?.close(4000, 'Simulated drop'), []);

  return { status, retryIn, send, drop };
}
