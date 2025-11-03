// client/src/StudentDashboard.js
// This is the (renamed) original Dashboard.js file

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // We'll keep using the same CSS file

function StudentDashboard() {
  const [user, setUser] = useState({ name: "Student", role: "student" });

  useEffect(() => {
    fetch('/profile')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(userData => {
        setUser(userData); 
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
      });
  }, []); 

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">
          <span role="img" aria-label="utensils" style={{ marginRight: '8px' }}>🍴</span>
          UniEats
        </div>
        <nav className="dashboard-nav">
        </nav>
        <div className="user-profile">
          <span className="user-name">Welcome, {user.name}!</span>
          <a href="/logout" className="logout-button-link">
            <button className="logout-button">Logout</button>
          </a>
        </div>
      </header>

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
              <button className="action-button">
                Profile & Settings
              </button>
            </Link>
            
            {user.role === 'admin' && (
              <Link to="/admin" className="action-button-link">
                <button className="action-button action-button-admin">
                  Admin Center
                </button>
              </Link>
            )}

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

      <footer className="dashboard-footer">
        UniEats &copy; 2025
      </footer>
    </div>
  );
}

export default StudentDashboard;