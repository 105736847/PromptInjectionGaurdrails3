/**
 * StudentsData.jsx – a tiny shared "data layer" for all demos on this page.
 *
 * The problem: every demo fetches its own copy of the students. When the
 * Create demo adds someone, the table, the charts and the other lists are
 * suddenly out of date (stale).
 *
 * The fix: after every successful change a demo calls
 *     notifyChange({ type: 'created', id: 61 })
 * which bumps `version`. Data hooks list `version` as an effect dependency,
 * so they all fetch again. (Libraries such as TanStack Query call this
 * "invalidating" cached queries.) `lastChange` lets tables highlight a row.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// The default value is used outside a provider: everything still works, the
// demos just don't refresh each other.
const StudentsDataContext = createContext({ version: 0, lastChange: null, notifyChange: () => {} });

export function StudentsDataProvider({ children }) {
  const [state, setState] = useState({ version: 0, lastChange: null });

  // useCallback → the same function every render, so it is safe in effect deps.
  const notifyChange = useCallback((change) => {
    setState((current) => ({ version: current.version + 1, lastChange: { ...change, at: Date.now() } }));
  }, []);

  const value = useMemo(() => ({ ...state, notifyChange }), [state, notifyChange]);

  // React 19: a context object can be rendered directly as its own provider.
  return <StudentsDataContext value={value}>{children}</StudentsDataContext>;
}

export function useStudentsData() {
  return useContext(StudentsDataContext);
}

/** The id of a student that was just created or updated (for 4 s) – to highlight its row. */
export function useHighlightedId() {
  const { lastChange } = useStudentsData();
  const [id, setId] = useState(null);

  useEffect(() => {
    if (!lastChange?.id || lastChange.type === 'deleted') return undefined;
    setId(lastChange.id);
    const timer = setTimeout(() => setId(null), 4000);
    return () => clearTimeout(timer); // a newer change cancels the old timer
  }, [lastChange]);

  return id;
}
