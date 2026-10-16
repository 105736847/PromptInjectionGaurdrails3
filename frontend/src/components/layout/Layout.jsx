
import { Outlet } from 'react-router';

import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

import './Layout.css';

function Layout() {
  return (
    <div className="app-layout">
      <Navbar />

      <div className="app-content">
        <Outlet />
      </div>

      <Footer />

    </div>
  );
}

export default Layout;
