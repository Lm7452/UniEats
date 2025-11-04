// client/src/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css'; 

function StudentDashboard() {
  const [user, setUser] = useState({ name: "Student", role: "student" });
  const [recentOrders, setRecentOrders] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    Promise.all([
      fetch('/profile'),
      fetch('/api/orders/my-history')
    ])
    .then(async ([profileRes, ordersRes]) => {
      if (!profileRes.ok) throw new Error('Not authenticated');
      const userData = await profileRes.json();
      setUser(userData);
      
      if (ordersRes.ok) {
        const orderData = await ordersRes.json();
        setRecentOrders(orderData.slice(0, 3)); 
      }
    })
    .catch(error => console.error("Error fetching dashboard data:", error))
    .finally(() => setIsLoading(false));
  }, []); 

  const renderStatus = (status) => {
    return <span className={`status-tag status-${status}`}>{status}</span>;
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">
          <span role="img" aria-label="utensils" style={{ marginRight: '8px' }}>🍴</span>
          UniEats
        </div>
        <nav className="dashboard-nav">
          {/* --- ADDED LINKS TO ROLE DASHBOARDS --- */}
          {user.role === 'admin' && (
            <Link to="/admin" className="header-nav-link">Admin Center</Link>
          )}
          {user.role === 'driver' && (
            <Link to="/driver-dashboard" className="header-nav-link">Driver Dashboard</Link>
          )}
          {/* --- END OF ADDITION --- */}
        </nav>
        <div className="user-profile">
          <span className="user-name">Welcome, {user.name}!</span>
          <a href="/logout" className="logout-button-link">
            <button className="logout-button">Logout</button>
          </a>
        </div>
      </header>

      <main className="dashboard-main">
        <h1 className="dashboard-title">Student Dashboard</h1>

        <section className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
          
            {/* --- ADDED 'state' PROP TO ALL LINKS --- */}
            <Link to="/new-order" className="action-button-link" state={{ from: '/student-dashboard' }}>
              <button className="action-button">Order Food Now!</button>
            </Link>

            <Link to="/order-history" className="action-button-link" state={{ from: '/student-dashboard' }}>
              <button className="action-button">View Order History</button>
            </Link>
            
            <Link to="/settings" className="action-button-link" state={{ from: '/student-dashboard' }}>
              <button className="action-button">
                Profile & Settings
              </button>
            </Link>
            {/* --- END OF 'state' PROP ADDITION --- */}

          </div>
        </section>

        <section className="dashboard-section">
          <h2>Recent Orders</h2>
          {isLoading ? (
            <p>Loading recent orders...</p>
          ) : recentOrders.length === 0 ? (
            <p>You have not placed any orders yet.</p>
          ) : (
            <div className="recent-orders-list">
              {recentOrders.map(order => (
                <div key={order.id} className="recent-order-item">
                  <div className="order-info">
                    <strong>{order.delivery_building}, {order.delivery_room}</strong>
                    <span className="order-time">{formatTime(order.created_at)}</span>
                  </div>
                  {renderStatus(order.status)}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="dashboard-footer">
        UniEats &copy; 2025
      </footer>
    </div>
  );
}

export default StudentDashboard;