// client/src/Header.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // We'll create this next

function Header() {
  const [user, setUser] = useState(null);

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
    <header className="app-header">
      {/* --- NEW WRAPPER TO GROUP LOGO + NAV --- */}
      <div className="header-left-side">
        <div className="logo-container">
          <Link to="/student-dashboard" className="logo-link">
            <span role="img" aria-label="utensils" style={{ marginRight: '8px' }}>🍴</span>
            UniEats
          </Link>
        </div>
        
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
    </header>
  );
}

export default Header;