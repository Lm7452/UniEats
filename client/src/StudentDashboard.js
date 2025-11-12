// client/src/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header'; 
import './Dashboard.css'; // Still used for section/button styles
import { formatStatus, statusClass } from './utils/statusUtils';

function StudentDashboard() {
  const [recentOrders, setRecentOrders] = useState([]); 
  const [activeOrder, setActiveOrder] = useState(null);
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
    fetch('/api/orders/my-history')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch order history');
        return res.json();
      })
      .then(orderData => {
        setRecentOrders(orderData.slice(0, 3)); 
        // determine an active order (not delivered or cancelled) - newest first
        const active = orderData
          .slice()
          .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
          .find(o => (o.status || 'pending') !== 'delivered' && (o.status || 'pending') !== 'cancelled');
        setActiveOrder(active || null);
      })
      .catch(error => console.error("Error fetching dashboard data:", error))
      .finally(() => setIsLoading(false));
  }, []); 

  const renderStatus = (status) => {
    const cls = statusClass(status);
    return <span className={`status-tag status-${cls}`}>{formatStatus(status)}</span>;
  };

  const steps = [
    { key: 'pending', label: 'Pending' },
    { key: 'claimed', label: 'Claimed' },
    { key: 'picked_up', label: 'Picked Up' },
    { key: 'en_route', label: 'En Route' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const renderTracker = (order) => {
    if (!order) return null;
    const cur = (order.status || 'pending');
    const curIndex = steps.findIndex(s => s.key === cur);
    return (
      <div className="order-tracker" aria-hidden={false}>
        {steps.map((s, idx) => {
          const state = idx < curIndex ? 'done' : (idx === curIndex ? 'active' : 'pending');
          return (
            <div key={s.key} className={`tracker-step ${state}`}>
              <div className="step-circle">{idx < curIndex ? '✓' : (idx === curIndex ? '●' : idx+1)}</div>
              <div className="step-label">{s.label}</div>
              {idx < steps.length - 1 && <div className={`step-line ${idx < curIndex ? 'done' : ''}`} />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    // --- UPDATED CLASSES ---
    <div className="page-container">
      <Header />
      <main className="page-main">
    {/* --- END OF UPDATE --- */}
        {activeOrder && (
          <section className="dashboard-section">
            <h2>Current Order Status</h2>
            {renderTracker(activeOrder)}
          </section>
        )}
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

      {/* --- UPDATED CLASS --- */}
      <footer className="page-footer">
        UniEats &copy; 2025
      </footer>
    </div>
  );
}

export default StudentDashboard;