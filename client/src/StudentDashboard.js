// client/src/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header'; // <-- 1. IMPORT HEADER
import './Dashboard.css'; 

function StudentDashboard() {
  // const [user, setUser] = useState({ name: "Student", role: "student" }); <-- 2. REMOVED USER STATE
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
    // 3. REMOVED PROFILE FETCH (Header does it now)
    fetch('/api/orders/my-history')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch order history');
        return res.json();
      })
      .then(orderData => {
        setRecentOrders(orderData.slice(0, 3)); 
      })
      .catch(error => console.error("Error fetching dashboard data:", error))
      .finally(() => setIsLoading(false));
  }, []); 

  const renderStatus = (status) => {
    return <span className={`status-tag status-${status}`}>{status}</span>;
  };

  return (
    // 4. Note: .dashboard-container is still used for the page body
    <div className="dashboard-container">
      
      {/* --- 5. REPLACED HEADER --- */}
      <Header />
      {/* --- END OF REPLACEMENT --- */}

      <main className="dashboard-main">
        <h1 className="dashboard-title">Student Dashboard</h1>

        <section className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
          
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
            
            {/* This button is now gone, as it's handled by the Header.
              But the CSS for .action-button-admin is still in Dashboard.css
              for the Admin Center to use.
            */}

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