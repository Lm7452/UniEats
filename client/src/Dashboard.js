// frontend/src/Dashboard.js
import React from 'react';
import './Dashboard.css'; // Import a CSS file for styling

function Dashboard() {
  const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Fallback for local dev

  // Placeholder user data - replace with fetched data later
  const placeholderUser = {
    name: "Tiger Student",
    // profilePictureUrl: 'path/to/default/avatar.png' // Add later if needed
  };

  return (
    <div className="dashboard-container">
      {/* --- Top Navigation / Header --- */}
      <header className="dashboard-header">
        <div className="logo">
          <span role="img" aria-label="utensils" style={{ marginRight: '8px' }}>🍴</span>
          UniEats
        </div>
        <nav className="dashboard-nav">
          {/* Add navigation links here if needed later */}
        </nav>
        <div className="user-profile">
          {/* Placeholder for profile picture */}
          {/* <img src={placeholderUser.profilePictureUrl} alt="Profile" className="profile-pic-placeholder" /> */}
          <span className="user-name">Welcome, {placeholderUser.name}!</span>
          <a href={`${BACKEND_URL}/logout`} className="logout-button-link">
            <button className="logout-button">Logout</button>
          </a>
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <main className="dashboard-main">
        <h1 className="dashboard-title">Your Dashboard</h1>

        <section className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-button">Place New Order</button>
            <button className="action-button">View Order History</button>
            {/* Add more actions as needed */}
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Recent Orders (Placeholder)</h2>
          <div className="order-list-placeholder">
            <p>Your recent orders will appear here.</p>
            {/* You could add placeholder elements for individual orders */}
            <div className="placeholder-order-item">Order #1234 - Frist Grill - Delivered</div>
            <div className="placeholder-order-item">Order #1230 - Frist Grill - Picked Up</div>
          </div>
        </section>

        {/* Add more sections like Settings, Favorites, etc. later */}

      </main>

      {/* --- Footer (Optional) --- */}
      <footer className="dashboard-footer">
        UniEats &copy; 2025
      </footer>
    </div>
  );
}

export default Dashboard;
