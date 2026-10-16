import { useCallback, useEffect, useState } from 'react';

/**
 * useFetch – loads JSON from a URL and tracks the three states every
 * network request has: loading, success (data) and failure (error).
 *
 *   const { data, loading, error, refetch } = useFetch('https://api.example.com/items');
 *
 * Pass `null` as the URL to skip the request (useful when you are still
 * waiting for user input).
 */
export default function useFetch(url, options) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Serialise the options so a new object literal on every render does not
  // cause an endless loop of requests.
  const optionsKey = JSON.stringify(options ?? {});

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return undefined;
    }

    // AbortController lets us cancel the request if the component unmounts
    // (or the URL changes) before the response arrives.
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(url, { ...JSON.parse(optionsKey), signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((json) => setData(json))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [url, optionsKey, reloadKey]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  return { data, loading, error, refetch };
}
