// client/src/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header'; 
import './Dashboard.css'; // Still used for section/button styles
import { formatStatus, statusClass } from './utils/statusUtils';
import { formatPhoneForDisplay, formatPhoneForTel } from './utils/phoneUtils';

function StudentDashboard() {
  const [recentOrders, setRecentOrders] = useState([]); 
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [graceSeconds, setGraceSeconds] = useState(300); // 5 minutes default
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // phone formatting helpers are imported from utils/phoneUtils

  useEffect(() => {
    fetch('/api/orders/my-history')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch order history');
        return res.json();
      })
      .then(orderData => {
        setRecentOrders(orderData.slice(0, 3)); 
        // determine an active order:
        // - prefer the newest order that is not delivered/cancelled
        // - if the newest delivered order was delivered within graceSeconds, show it as active for that window
        const sorted = orderData.slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        let active = sorted.find(o => {
          const s = (o.status || 'pending');
          return s !== 'delivered' && s !== 'cancelled';
        });
        if (!active) {
          // check for recently delivered
          const recentlyDelivered = sorted.find(o => {
            const s = (o.status || 'pending');
            if (s !== 'delivered') return false;
            const deliveredAt = o.updated_at || o.delivered_at || o.created_at;
            if (!deliveredAt) return false;
            const diff = Date.now() - new Date(deliveredAt).getTime();
            return diff <= (graceSeconds * 1000);
          });
          active = recentlyDelivered || null;
        }
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
    // compute remainingSeconds if delivered recently
    let deliveredAgo = null;
    if (cur === 'delivered') {
      const deliveredAt = order.updated_at || order.delivered_at || order.created_at;
      if (deliveredAt) deliveredAgo = Math.floor((Date.now() - new Date(deliveredAt).getTime()) / 1000);
    }

    return (
      <div className="order-tracker circle-tracker" aria-hidden={false}>
        {steps.map((s, idx) => {
          const state = idx < curIndex ? 'done' : (idx === curIndex ? 'active' : 'pending');
          return (
            <React.Fragment key={s.key}>
              <div className={`circle-step ${state}`}>
                <div className={`circle ${state}`} aria-hidden>
                  {state === 'done' ? '✓' : (idx + 1)}
                </div>
                <div className="step-label">{s.label}</div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`tracker-arrow ${idx < curIndex ? 'done' : ''}`} aria-hidden>
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Driver info box */}
        {(order.driver_name || order.driver_phone) && (
          <div className="tracker-driver">
            <div className="driver-avatar">{(order.driver_name || 'D').split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
            <div className="driver-details">
              <div className="driver-name">Driver: {order.driver_name || 'Assigned'}</div>
              {order.driver_phone ? (
                <a className="driver-phone" href={formatPhoneForTel(order.driver_phone)}>{formatPhoneForDisplay(order.driver_phone)}</a>
              ) : (
                <div className="driver-phone muted">Contact not available</div>
              )}
            </div>
          </div>
        )}

        {cur === 'delivered' && deliveredAgo !== null && (
          <div className="tracker-footer">Delivered — this will move to your order history in {formatRemaining(Math.max(0, graceSeconds - deliveredAgo))}</div>
        )}
      </div>
    );
  };

  const formatRemaining = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Tick remainingSeconds when there is an active delivered order
  useEffect(() => {
    if (!activeOrder) {
      setRemainingSeconds(null);
      return;
    }
    if ((activeOrder.status || 'pending') !== 'delivered') {
      setRemainingSeconds(null);
      return;
    }
    const deliveredAt = activeOrder.updated_at || activeOrder.delivered_at || activeOrder.created_at;
    if (!deliveredAt) return;
    const updateRemaining = () => {
      const elapsed = Math.floor((Date.now() - new Date(deliveredAt).getTime()) / 1000);
      const rem = Math.max(0, graceSeconds - elapsed);
      setRemainingSeconds(rem);
      if (rem <= 0) {
        setActiveOrder(null);
      }
    };
    updateRemaining();
    const id = setInterval(updateRemaining, 1000);
    return () => clearInterval(id);
  }, [activeOrder, graceSeconds]);

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