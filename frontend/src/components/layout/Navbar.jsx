

import { NavLink } from 'react-router';

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">

        <span className="navbar-brand">
          Prompt Injection Guardrail Checker
        </span>

        <nav className="navbar-links" aria-label="Main navigation">

          <NavLink to="/" end>
            Home
          </NavLink>

          <NavLink to="/results">
            Results
          </NavLink>

          <NavLink to="/aboutUs">About Us</NavLink>
          <NavLink to="/ourData">Our Data</NavLink>

        </nav>
      </div>
    </header>
  );
}

export default Navbar;