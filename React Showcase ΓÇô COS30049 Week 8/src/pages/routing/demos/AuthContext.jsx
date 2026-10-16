/**
 * AuthContext – a pretend login, shared through context.
 *
 * There is no server and no password: `user` is just React state. That is
 * enough to show how a protected route works. (A real app would check a token
 * issued by the back-end – and the back-end must ALSO check it, because
 * anything in the browser can be changed by the user.)
 */
import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = logged out

  // useMemo: consumers only re-render when `user` really changes.
  const value = useMemo(
    () => ({
      user,
      login: (name) => setUser({ name }),
      logout: () => setUser(null),
    }),
    [user],
  );

  // React 19: a context can be rendered directly as its provider
  // (older code writes <AuthContext.Provider value={value}>).
  return <AuthContext value={value}>{children}</AuthContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth() must be used inside <AuthProvider>');
  return context;
}
