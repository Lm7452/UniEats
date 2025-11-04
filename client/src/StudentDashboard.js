// client/src/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // We'll keep using the same CSS file

function StudentDashboard() {
  const [user, setUser] = useState({ name: "Student", role: "student" });
  const [recentOrders, setRecentOrders] = useState([]); // <-- 1. ADD NEW STATE
  const [isLoading, setIsLoading] = useState(true); // <-- 2. ADD LOADING STATE

  // Function to format time nicely
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    // Fetch profile and order history at the same time
    Promise.all([
      fetch('/profile'),
      fetch('/api/orders/my-history')
    ])
    .then(async ([profileRes, ordersRes]) => {
      if (!profileRes.ok) {
        throw new Error('Not authenticated');
      }
      const userData = await profileRes.json();
      setUser(userData);
      
      if (ordersRes.ok) {
        const orderData = await ordersRes.json();
        // 3. Get the first 3 orders
        setRecentOrders(orderData.slice(0, 3)); 
      }
    })
    .catch(error => {
      console.error("Error fetching dashboard data:", error);
    })
    .finally(() => {
      setIsLoading(false); // 4. Set loading to false
    });
  }, []); 

  // Helper to render the status tag
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

            <Link to="/order-history" className="action-button-link">
              <button className="action-button">View Order History</button>
            </Link>
            
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

        {/* --- 5. UPDATED THIS SECTION --- */}
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
                  <div className="order-status">
                    {renderStatus(order.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        {/* --- END OF UPDATE --- */}
      </main>

      <footer className="dashboard-footer">
        UniEats &copy; 2025
      </footer>
    </div>
  );
}

export default StudentDashboard;