// client/src/DriverDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header'; 
import './DriverDashboard.css'; // Still used for card/button styles

function DriverDashboard() {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchData = useCallback((isInitialLoad = false) => {
    if(isInitialLoad) setIsLoading(true);
    setError('');

    Promise.all([
      fetch('/api/driver/orders/available'),
      fetch('/api/driver/orders/mine')
    ])
    .then(async ([availableRes, mineRes]) => {
      if (availableRes.status === 403) throw new Error('You are not authorized to view this page.');
      if (!availableRes.ok || !mineRes.ok) throw new Error('Failed to fetch data.');
      
      const available = await availableRes.json();
      const mine = await mineRes.json();
      
      setAvailableOrders(available);
      setMyOrders(mine);
    })
    .catch(err => {
      console.error("Error fetching driver data:", err);
      setError(err.message);
      if (err.message.includes('authorized')) {
        setTimeout(() => navigate('/'), 2000);
      }
    })
    .finally(() => {
      if(isInitialLoad) setIsLoading(false);
    });
  }, [navigate]); 

  useEffect(() => {
    fetchData(true); 
    const intervalId = setInterval(() => fetchData(false), 30000); 
    return () => clearInterval(intervalId);
  }, [fetchData]); 

  const handleClaimOrder = (orderId) => {
    const orderToClaim = availableOrders.find(o => o.id === orderId);
    if (!orderToClaim) return;
    setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
    fetch(`/api/driver/orders/${orderId}/claim`, { method: 'PUT' })
    .then(res => {
      if (res.status === 409) throw new Error('Order was already claimed.');
      if (!res.ok) throw new Error('Failed to claim order.');
      return res.json();
    })
    .then(claimedOrder => {
      claimedOrder.customer_phone = orderToClaim.customer_phone;
      setMyOrders(prev => [claimedOrder, ...prev]);
      setError(''); 
    })
    .catch(err => {
      console.error(err);
      setError(err.message);
      setAvailableOrders(prev => [orderToClaim, ...prev]);
    });
  };
  
  const handleCompleteOrder = (orderId) => {
    setMyOrders(prev => prev.filter(o => o.id !== orderId));
    fetch(`/api/driver/orders/${orderId}/complete`, { method: 'PUT' })
    .then(res => {
      if (!res.ok) throw new Error('Failed to complete order.');
      return res.json();
    })
    .then(completedOrder => {
      console.log('Order completed:', completedOrder.id);
      setError(''); 
    })
    .catch(err => {
      console.error(err);
      setError(err.message);
      fetchData(false); 
    });
  };

  if (isLoading) {
    return (
      // --- UPDATED CLASSES ---
      <div className="page-container">
        <Header />
        <main className="page-main">Loading driver data...</main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
    {/* --- END OF UPDATE --- */}
        {error && <div className="driver-error-message">{error}</div>}
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
                  <p><strong>Contact:</strong> 
                    <a href={`tel:${order.customer_phone}`}>{order.customer_phone || 'Not Provided'}</a>
                  </p>
                  <p className="order-tip">Tip: ${parseFloat(order.tip_amount).toFixed(2)}</p>
                  <p className="order-time">Placed at: {formatTime(order.created_at)}</p>
                  <div className="order-actions">
                    <button 
                      className="action-button-complete"
                      onClick={() => handleCompleteOrder(order.id)}
                    >
                      Mark as Complete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

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
                  <p><strong>Contact:</strong> {order.customer_phone || 'Not Provided'}</p>
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
      </main>
      {/* --- UPDATED CLASS --- */}
      <footer className="page-footer">
        UniEats &copy; 2025
      </footer>
    </div>
  );
}

export default DriverDashboard;