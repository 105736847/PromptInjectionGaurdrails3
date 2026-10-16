/**
 * AuthContext – ONE place in the React app that knows who is logged in.
 *
 *   <AuthProvider> … </AuthProvider>     wrap everything that needs the login
 *   const { user, token, login, logout, authFetch } = useAuth();
 *
 * Why a context? The header, the profile page, the "lecturer only" button … all
 * need the same user and token. Passing them down through every component as
 * props ("prop drilling") gets messy – a context makes them available anywhere below.
 *
 * Where is the token kept?
 *   - By default only in React STATE (memory): it disappears on reload, and it is
 *     not sitting in storage where any injected script (XSS) could read it.
 *   - Optionally ALSO in sessionStorage (`persist`), so a reload keeps you logged in.
 *   The "Where should the token live?" demo explains the trade-off.
 *
 * In your own app this file would live in src/context/ and wrap <App /> in main.jsx.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { api, apiFetch, ApiError } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { decodeJwt } from './jwt.js';

export const STORAGE_KEY = 'showcase.auth.session';

// Fictional demo accounts seeded by backend/app/models/user.py (never do this in production!).
export const DEMO_ACCOUNTS = [
  { username: 'student', password: 'student123', label: 'Student' },
  { username: 'lecturer', password: 'lecturer123', label: 'Lecturer' },
];

const AuthContext = createContext(null);

// sessionStorage can throw (private mode, blocked site data) – never let that crash the app.
function readStoredSession() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (stored?.token && stored.expiresAt > Date.now()) return stored; // ignore expired leftovers
  } catch {
    /* no storage available */
  }
  return null;
}

function writeStoredSession(session) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no storage available */
  }
}

/** Turn the /api/auth/login response into the session object we keep. */
function sessionFrom(data) {
  const claims = decodeJwt(data.access_token)?.payload;
  return {
    token: data.access_token,
    user: data.user,
    // The token's own "exp" claim (seconds since 1970) is what the server checks.
    expiresAt: claims?.exp ? claims.exp * 1000 : Date.now() + data.expires_in * 1000,
    lifetime: data.expires_in, // seconds – used to draw progress bars
  };
}

export function AuthProvider({ children }) {
  const { showToast } = useToast();
  // Lazy initialisers (a function, not a value) run only on the FIRST render.
  const [session, setSession] = useState(readStoredSession);
  const [persist, setPersist] = useState(() => readStoredSession() !== null);
  const [notice, setNotice] = useState(null); // why we were logged out (shown in the UI)

  // Effect = keep something OUTSIDE React (sessionStorage) in sync with state.
  useEffect(() => {
    writeStoredSession(persist ? session : null);
  }, [persist, session]);

  // The current token for async code that finishes LATER (see authFetch below).
  const tokenRef = useRef(session?.token ?? null);
  useEffect(() => {
    tokenRef.current = session?.token ?? null;
  }, [session]);

  const login = useCallback(async (username, password, { minutes } = {}) => {
    // FastAPI's OAuth2PasswordRequestForm reads FORM fields, not JSON → URLSearchParams.
    const form = new URLSearchParams({ username, password });
    const query = minutes ? `?minutes=${minutes}` : '';
    try {
      const data = await api.post(`/api/auth/login${query}`, form);
      setSession(sessionFrom(data));
      setNotice(null);
      return data;
    } catch (error) {
      // Our 429 detail is { message, retry_after } – re-throw it with the readable message.
      if (error instanceof ApiError && error.status === 429 && error.detail?.message) {
        throw new ApiError(error.detail.message, { status: 429, detail: error.detail, url: error.url });
      }
      throw error;
    }
  }, []);

  const logout = useCallback((reason = null) => {
    // Logging out of a JWT app = forgetting the token. The server keeps no session,
    // so the token itself stays valid until "exp" (another reason to keep it short-lived).
    setSession(null);
    setNotice(reason);
  }, []);

  const token = session?.token ?? null;

  /**
   * authFetch(path, options) – apiFetch + "Authorization: Bearer <token>".
   * If the server answers 401 (expired, forged or unknown token) we log out.
   */
  const authFetch = useCallback(
    async (path, options = {}) => {
      try {
        return await apiFetch(path, { ...options, token });
      } catch (error) {
        // Only if the token that failed is STILL the current one: a slow, stale
        // request must not end a newer session.
        if (error instanceof ApiError && error.status === 401 && token && token === tokenRef.current) {
          logout(`Logged out automatically – the server answered 401: ${error.message}`);
          showToast({ type: 'warning', title: 'Session ended (401)', message: error.message });
        }
        throw error;
      }
    },
    [token, logout, showToast],
  );

  const updateUser = useCallback((user) => {
    setSession((current) => (current ? { ...current, user } : current));
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  // useMemo: consumers only re-render when something in the value really changed.
  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token,
      expiresAt: session?.expiresAt ?? null,
      lifetime: session?.lifetime ?? null,
      notice,
      persist,
      setPersist,
      login,
      logout,
      authFetch,
      updateUser,
      clearNotice,
    }),
    [session, token, notice, persist, login, logout, authFetch, updateUser, clearNotice],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth() must be used inside <AuthProvider>.');
  return context;
}
