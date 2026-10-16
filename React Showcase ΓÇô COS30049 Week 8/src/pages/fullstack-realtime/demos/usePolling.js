/**
 * usePolling – ask the server again and again until the answer says "finished".
 *
 *   const { data, error, requests } = usePolling(
 *     (signal) => api.get(`/api/jobs/${id}`, { signal }),
 *     { interval: 500, isDone: (job) => job.status === 'completed' },
 *   );
 *
 * - setTimeout AFTER each answer (not setInterval): a slow server never gets a second request
 *   before it has answered the first one.
 * - After a network/server error we wait 4× longer – the server may be restarting.
 *   After a 4xx answer (e.g. 404: the job no longer exists) we stop – asking again won't help.
 * - The cleanup stops the loop and aborts the request in flight when the component unmounts,
 *   so nothing updates a component that is gone and no requests are wasted.
 */
import { useEffect, useEffectEvent, useState } from 'react';

export default function usePolling(request, { interval = 500, isDone = () => false, key } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState(0);

  // useEffectEvent: always calls the LATEST `request` / `isDone` passed in, without listing them
  // as effect dependencies (they are new functions on every render and would restart the loop).
  const load = useEffectEvent((signal) => request(signal));
  const finished = useEffectEvent((result) => isDone(result));

  useEffect(() => {
    const controller = new AbortController();
    let timer;

    async function tick() {
      let wait = interval;
      try {
        setRequests((n) => n + 1);
        const result = await load(controller.signal);
        setData(result);
        setError(null);
        if (finished(result)) return; // done – stop polling
      } catch (err) {
        if (controller.signal.aborted) return; // we were cleaned up – stay quiet
        setError(err);
        if (err.status >= 400 && err.status < 500) return; // e.g. 404: asking again won't help
        wait = interval * 4;
      }
      timer = setTimeout(tick, wait);
    }

    tick();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [key, interval]);

  return { data, error, requests };
}
