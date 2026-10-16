/**
 * StudentRoutes – the route table of the mini "student portal".
 *
 * App.jsx mounts this page at "routing/*", so the paths below are RELATIVE to
 * "/routing": path="admin" matches "/routing/admin". Links and navigate()
 * calls elsewhere use ABSOLUTE paths ("/routing/admin") to avoid surprises.
 *
 * PortalLayout is a "layout route": it has no path, renders the portal's
 * navigation, and shows the matching child route in its <Outlet />.
 */
import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';
import Breadcrumbs from './Breadcrumbs.jsx';
import StudentDirectory from './StudentDirectory.jsx';
import StudentDetail from './StudentDetail.jsx';
import LoginPage from './LoginPage.jsx';
import AdminPage from './AdminPage.jsx';
import RequireAuth from './RequireAuth.jsx';
import RouteNotFound from './RouteNotFound.jsx';

// NavLink passes { isActive } so we can style the link of the current page.
const navClass = ({ isActive }) => `routing-tab${isActive ? ' active' : ''}`;

function PortalLayout() {
  const { user } = useAuth();
  return (
    <div className="routing-portal">
      <nav className="routing-tabs" aria-label="Portal">
        {/* `end`: only active on exactly "/routing", not on every page below it */}
        <NavLink to="/routing" end className={navClass}>
          Directory
        </NavLink>
        <NavLink to="/routing/admin" className={navClass}>
          {!user && <Lock size={13} role="img" aria-label="Requires login:" />} Admin
        </NavLink>
        <NavLink to="/routing/login" className={navClass}>
          {user ? `Hi, ${user.name}` : 'Log in'}
        </NavLink>
      </nav>
      <Breadcrumbs />
      {/* The matching child route renders here */}
      <Outlet />
    </div>
  );
}

export default function StudentRoutes() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route index element={<StudentDirectory />} />
        <Route path="students/:studentId" element={<StudentDetail />} />
        {/* Redirects: an old URL, and "/routing/students" without an id */}
        <Route path="old-directory" element={<Navigate to="/routing" replace />} />
        <Route path="students" element={<Navigate to="/routing" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route
          path="admin"
          element={
            <RequireAuth>
              <AdminPage />
            </RequireAuth>
          }
        />
        {/* Catch-all: anything else under /routing/ */}
        <Route path="*" element={<RouteNotFound />} />
      </Route>
    </Routes>
  );
}
