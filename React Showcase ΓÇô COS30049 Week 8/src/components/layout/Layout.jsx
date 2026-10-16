/**
 * Layout – the frame around every page: header on top, sidebar on the left,
 * the current page in the middle and a footer at the bottom.
 *
 * <Outlet /> is a placeholder from React Router: it renders whichever child
 * route matches the URL (see the nested <Route>s in App.jsx).
 */
import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import Footer from './Footer.jsx';
import PageNav from './PageNav.jsx';
import BackToTop from './BackToTop.jsx';
import ErrorBoundary from '../common/ErrorBoundary.jsx';
import PageLoader from '../common/PageLoader.jsx';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  // "/routing/users/3" → "routing". Only the top-level section matters here,
  // so moving between nested routes inside a page does not jump to the top.
  const section = pathname.split('/')[1];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [section]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <Header sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen((open) => !open)} />

      <div className="app-body">
        <Sidebar open={sidebarOpen} onNavigate={closeSidebar} />
        {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} aria-hidden="true" />}

        <main id="main" className="app-main">
          <div className="page-content">
            {/* key={section} resets the boundary when the student moves to another page */}
            <ErrorBoundary key={section}>
              {/* Suspense shows a fallback while a lazy() page is loading */}
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
            <PageNav />
          </div>
          <Footer />
        </main>
      </div>

      <BackToTop />
    </>
  );
}
