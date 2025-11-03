// frontend/src/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // Import a CSS file for styling

function Dashboard() {
  // State to hold the user's name AND role
  const [user, setUser] = useState({ name: "Student", role: "student" });

  useEffect(() => {
    // Fetch the user's profile data from the backend
    fetch('/profile')
      .then(res => {
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then(userData => {
        // 'userData' is the full user object from the database
        setUser(userData); 
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
      });
  }, []); // The empty array [] means this effect runs once when the component mounts

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
          <span className="user-name">Welcome, {user.name}!</span>
          <a href="/logout" className="logout-button-link">
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
          
            <Link to="/new-order" className="action-button-link">
              <button className="action-button">Order Food Now!</button>
            </Link>

            <button className="action-button">View Order History</button>
            
            <Link to="/settings" className="action-button-link">
              <button className="action-button action-button-secondary">
                Profile & Settings
              </button>
            </Link>
            
            {/* --- CONDITIONAL ADMIN BUTTON --- */}
            {user.role === 'admin' && (
              <Link to="/admin" className="action-button-link">
                <button className="action-button action-button-admin">
                  Admin Center
                </button>
              </Link>
            )}
            {/* --- END OF CONDITIONAL BUTTON --- */}

          </div>
        </section>

        <section className="dashboard-section">
          <h2>Recent Orders (Placeholder)</h2>
          <div className="order-list-placeholder">
            <p>Your recent orders will appear here.</p>
            <div className="placeholder-order-item">Order #1234 - Frist Grill - Delivered</div>
            <div className="placeholder-order-item">Order #1230 - Frist Grill - Picked Up</div>
          </div>
        </section>
      </main>

      {/* --- Footer (Optional) --- */}
      <footer className="dashboard-footer">
        UniEats &copy; 2025
      </footer>
    </div>
  );
}

export default Dashboard;