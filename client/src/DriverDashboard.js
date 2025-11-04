// client/src/DriverDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './DriverDashboard.css'; // We'll create this next

function DriverDashboard() {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Function to format time nicely
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // We use useCallback to memoize this function
  const fetchData = useCallback(() => {
    setIsLoading(true);
    setError('');

    // Fetch both sets of orders simultaneously
    Promise.all([
      fetch('/api/driver/orders/available'),
      fetch('/api/driver/orders/mine')
    ])
    .then(async ([availableRes, mineRes]) => {
      if (availableRes.status === 403 || mineRes.status === 403) {
        throw new Error('You are not authorized to view this page.');
      }
      if (!availableRes.ok || !mineRes.ok) {
        throw new Error('Failed to fetch orders.');
      }
      const available = await availableRes.json();
      const mine = await mineRes.json();
      setAvailableOrders(available);
      setMyOrders(mine);
    })
    .catch(err => {
      console.error("Error fetching driver data:", err);
      setError(err.message);
      if (err.message.includes('authorized')) {
        setTimeout(() => navigate('/student-dashboard'), 2000);
      }
    })
    .finally(() => {
      setIsLoading(false);
    });
  }, [navigate]);

  // Fetch data on initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle claiming an order
  const handleClaimOrder = (orderId) => {
    // Find the order we're about to claim
    const orderToClaim = availableOrders.find(o => o.id === orderId);
    if (!orderToClaim) return;

    // Optimistically remove it from the available list
    setAvailableOrders(prev => prev.filter(o => o.id !== orderId));

    // Send request to the API
    fetch(`/api/driver/orders/${orderId}/claim`, {
      method: 'PUT'
    })
    .then(res => {
      if (res.status === 409) { // 409 Conflict
        throw new Error('Order was already claimed by someone else.');
      }
      if (!res.ok) {
        throw new Error('Failed to claim order.');
      }
      return res.json();
    })
    .then(claimedOrder => {
      // Success! Add the newly claimed order to "My Orders"
      setMyOrders(prev => [claimedOrder, ...prev]);
      setError(''); // Clear any previous errors
    })
    .catch(err => {
      console.error(err);
      setError(err.message);
      // Rollback: Add the order back to the available list if the claim failed
      setAvailableOrders(prev => [orderToClaim, ...prev]);
    });
  };

  if (isLoading) {
    return <div className="driver-container">Loading driver data...</div>;
  }

  return (
    <div className="driver-container">
      <header className="driver-header">
        <h1>Driver Dashboard</h1>
        {/* Link back to Admin Center if user is an admin */}
        <Link to="/admin" className="back-link">Admin Center</Link>
      </header>

      {error && <div className="driver-error-message">{error}</div>}

      {/* --- MY CLAIMED ORDERS SECTION --- */}
      <section className="driver-section">
        <h2>My Claimed Orders ({myOrders.length})</h2>
        <div className="order-list">
          {myOrders.length === 0 ? (
            <p className="no-orders-message">You have not claimed any orders yet.</p>
          ) : (
            myOrders.map(order => (
              <div key={order.id} className="order-card claimed">
                <h3>Order for {order.customer_name}</h3>
                <p><strong>Order #:</strong> {order.princeton_order_number}</p>
                <p><strong>Deliver To:</strong> {order.delivery_building} - Room {order.delivery_room}</p>
                <p className="order-tip">Tip: ${parseFloat(order.tip_amount).toFixed(2)}</p>
                <p className="order-time">Placed at: {formatTime(order.created_at)}</p>
                <div className="order-actions">
                  <button className="action-button-secondary" disabled>Mark as Complete (WIP)</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* --- AVAILABLE ORDERS SECTION --- */}
      <section className="driver-section">
        <h2>Available Orders ({availableOrders.length})</h2>
        <div className="order-list">
          {availableOrders.length === 0 ? (
            <p className="no-orders-message">No available orders right now. Check back soon!</p>
          ) : (
            availableOrders.map(order => (
              <div key={order.id} className="order-card">
                <h3>Order for {order.customer_name}</h3>
                <p><strong>Order #:</strong> {order.princeton_order_number}</p>
                <p><strong>Deliver To:</strong> {order.delivery_building} - Room {order.delivery_room}</p>
                <p className="order-tip">Tip: ${parseFloat(order.tip_amount).toFixed(2)}</p>
                <p className="order-time">Placed at: {formatTime(order.created_at)}</p>
                <div className="order-actions">
                  <button 
                    className="action-button"
                    onClick={() => handleClaimOrder(order.id)}
                  >
                    Claim Order
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default DriverDashboard;