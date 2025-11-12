// client/src/OrderHistory.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // 1. Import useLocation
import './OrderHistory.css'; 
import { formatStatus, statusClass } from './utils/statusUtils';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation(); // 2. Get location info

  // 3. Set the 'back' URL
  const backUrl = location.state?.from || '/student-dashboard';

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
        if (res.status === 401) throw new Error('Not authenticated');
        if (!res.ok) throw new Error('Failed to fetch order history');
        return res.json();
      })
      .then(data => {
        setOrders(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching history:", err);
        setError(err.message);
        setIsLoading(false);
        if (err.message.includes('authenticated')) {
          setTimeout(() => navigate('/'), 2000);
        }
      });
  }, [navigate]);

  const renderStatus = (status) => {
    const cls = statusClass(status);
    return <span className={`status-tag status-${cls}`}>{formatStatus(status)}</span>;
  };

  if (isLoading) {
    return <div className="history-container">Loading your order history...</div>;
  }

  if (error) {
    return <div className="history-container error-message">{error}</div>;
  }

  return (
    <div className="history-container">
      <header className="history-header">
        <h1>My Order History</h1>
        {/* 4. Use the dynamic backUrl */}
        <Link to={backUrl} className="back-link">&larr; Back</Link>
      </header>
      
      <section className="history-section">
        <div className="order-table-container">
          <table className="order-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date Placed</th>
                <th>Deliver To</th>
                <th>Tip</th>
                <th>Status</th>
                <th>Driver</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>You have not placed any orders yet.</td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.princeton_order_number}</td>
                    <td>{formatTime(order.created_at)}</td>
                    <td>{order.delivery_building}, {order.delivery_room}</td>
                    <td>${parseFloat(order.tip_amount).toFixed(2)}</td>
                    <td>{renderStatus(order.status)}</td>
                    <td>{order.driver_name || 'Not claimed'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default OrderHistory;