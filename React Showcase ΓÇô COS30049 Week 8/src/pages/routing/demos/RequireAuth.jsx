/**
 * RequireAuth – a "guard" around routes that need a logged-in user.
 *
 *   <Route path="admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
 *
 * Logged in → render the page. Logged out → <Navigate> to the login page and
 * remember where the user wanted to go (in location state), so the login page
 * can send them back there afterwards.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // `replace` swaps the current history entry, so the Back button doesn't
    // bounce the user straight back into this redirect.
    return <Navigate to="/routing/login" replace state={{ from: location }} />;
  }

  return children;
}
