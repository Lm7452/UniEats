// client/src/Header.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // We'll create this next

function Header({ hideLogin = false }) {
  const [user, setUser] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    // Fetch the user's profile to get name and role
    fetch('/profile')
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        return null; // Not logged in
      })
      .then(userData => {
        if (userData) {
          setUser(userData);
        }
      })
      .catch(error => console.error("Error fetching profile:", error));
  }, []);

  return (
    <header className={`app-header ${navOpen ? 'nav-open' : ''}`}>
      {/* --- NEW WRAPPER TO GROUP LOGO + NAV --- */}
      <div className="header-left-side">
        <div className="logo-container">
          <Link to="/student-dashboard" className="logo-link">
            <span role="img" aria-label="utensils" style={{ marginRight: '8px' }}>🍴</span>
            UniEats
          </Link>
        </div>
        {/* Show mobile menu toggle only for driver/admin users (desktop hides it via CSS) */}
        {user && (user.role === 'driver' || user.role === 'admin') && (
          <button
            className="menu-toggle"
            aria-label="Toggle navigation"
            onClick={() => setNavOpen(open => !open)}
          >
            <span className="hamburger" />
          </button>
        )}

        <nav className="header-nav">
          {user && (user.role === 'driver' || user.role === 'admin') && (
            <Link to="/student-dashboard" className="header-nav-link">Student Dashboard</Link>
          )}
          {user && (user.role === 'driver' || user.role === 'admin') && (
            <Link to="/driver-dashboard" className="header-nav-link">Driver Dashboard</Link>
          )}
          {user && user.role === 'admin' && (
            <Link to="/admin" className="header-nav-link">Admin Center</Link>
          )}
        </nav>
      </div>
      {/* --- END OF WRAPPER --- */}

      {!hideLogin && (
        <div className="user-profile">
          {user ? (
            <>
              <span className="user-name">Welcome, {user.name}!</span>
              <a href="/logout" className="logout-button-link">
                <button className="logout-button">Logout</button>
              </a>
            </>
          ) : (
            <a href="/login" className="logout-button-link">
              <button className="logout-button">Login</button>
            </a>
          )}
        </div>
      )}
      {/* Mobile overlay nav (covers screen when open). Rendered for drivers/admin only. */}
      {navOpen && user && (user.role === 'driver' || user.role === 'admin') && (
        <div className="mobile-nav-overlay" onClick={() => setNavOpen(false)}>
          <nav className="mobile-nav" onClick={(e) => e.stopPropagation()}>
            {user && (user.role === 'driver' || user.role === 'admin') && (
              <Link to="/student-dashboard" className="mobile-nav-link" onClick={() => setNavOpen(false)}>Student Dashboard</Link>
            )}
            {user && (user.role === 'driver' || user.role === 'admin') && (
              <Link to="/driver-dashboard" className="mobile-nav-link" onClick={() => setNavOpen(false)}>Driver Dashboard</Link>
            )}
            {user && user.role === 'admin' && (
              <Link to="/admin" className="mobile-nav-link" onClick={() => setNavOpen(false)}>Admin Center</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;