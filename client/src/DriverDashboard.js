// client/src/DriverDashboard.js
// Driver dashboard component for managing and viewing delivery orders
// Includes real-time updates via WebSocket and driver availability status

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header'; 
import './DriverDashboard.css'; 
import { formatStatus, statusClass } from './utils/statusUtils';
import { formatPhoneForDisplay, formatPhoneForTel } from './utils/phoneUtils';
import socket, { register } from './utils/socket';

function DriverDashboard() {
  // State variables
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();

  // Format ISO date string to readable format
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render delivery address based on location type
  const renderDeliveryAddress = (order) => {
    const lt = (order.location_type || '').toLowerCase();
    const building = order.delivery_building || '';
    const hall = order.residence_hall || '';
    const room = order.delivery_room || '';

    if (lt === 'residential' || lt === 'residential college') {
      // Residential College: show building, hall, and room
      const parts = [];
      if (building) parts.push(building);
      if (hall) parts.push(`Hall: ${hall}`);
      if (room) parts.push(`Room ${room}`);
      return parts.length > 0 ? parts.join(' — ') : 'N/A';
    }

    // Upperclassmen Hall: show building and room
    if (lt === 'upperclassmen' || lt === 'upperclassmen hall') {
      return building ? `${building}${room ? ' — Room ' + room : ''}` : 'N/A';
    }

    // Campus Building or Free-text Location
    if (lt === 'campus' || lt === 'campus building') {
      return building ? `${building}${room ? ' — ' + room : ''}` : (room || 'N/A');
    }

    // Fallback: show building and room if available
    if (building || room) return `${building}${room ? ' - Room ' + room : ''}`;
    return 'N/A';
  };

  // Fetch driver profile and orders
  const fetchData = useCallback((isInitialLoad = false) => {
    if(isInitialLoad) setIsLoading(true);
    setError('');

    Promise.all([
      fetch('/profile'), 
      fetch('/api/driver/orders/available'),
      fetch('/api/driver/orders/mine')
    ])
    .then(async ([profileRes, availableRes, mineRes]) => {
      if (!profileRes.ok) {
        const errBody = await safeParseJson(profileRes);
        throw new Error(errBody?.error || `Profile fetch failed (${profileRes.status})`);
      }
      if (!availableRes.ok) {
        const errBody = await safeParseJson(availableRes);
        throw new Error(errBody?.error || `Available orders fetch failed (${availableRes.status})`);
      }
      if (!mineRes.ok) {
        const errBody = await safeParseJson(mineRes);
        throw new Error(errBody?.error || `My orders fetch failed (${mineRes.status})`);
      }

      // Parse JSON responses
      const userData = await profileRes.json();
      const available = await availableRes.json();
      const mine = await mineRes.json();
      
      setUser(userData);
      setIsAvailable(userData.is_available);
      setAvailableOrders(available);
      setMyOrders(mine);
    })
    .catch(err => {
      console.error("Error fetching driver data:", err);
      setError(err.message || 'Failed to fetch driver data');
    })
    .finally(() => {
      if(isInitialLoad) setIsLoading(false);
    });
  }, [navigate]); 

  // Helper to parse JSON responses safely
  const safeParseJson = async (res) => {
    try {
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  // Initial data fetch and setup periodic refresh
  useEffect(() => {
    fetchData(true); 
    const intervalId = setInterval(() => fetchData(false), 30000); 
    return () => clearInterval(intervalId);
  }, [fetchData]); 

  // Setup WebSocket event listeners
  useEffect(() => {
    if (!user) return;
    try {
      register({ userId: user.id, role: user.role });
    } catch (err) {
      console.error('Socket register failed', err);
    }

    const onOrderCreated = (order) => {
      // Only show new available orders when driver is online
      setAvailableOrders(prev => {
        if (prev.some(o => o.id === order.id)) return prev;
        return [...prev, order];
      });
    };

    // Remove claimed order from available and add to my orders
    const onOrderClaimed = ({ orderId }) => {
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
      // If the claimed order is one of our claimed orders, remove it
      setMyOrders(prev => prev.filter(o => o.id !== orderId));
    };

    // Update order status in my orders
    const onOrderStatusChanged = ({ orderId, status }) => {
      setMyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (status === 'delivered') {
        setMyOrders(prev => prev.filter(o => o.id !== orderId));
      }
    };

    // Register event listeners
    socket.on('order_created', onOrderCreated);
    socket.on('order_claimed', onOrderClaimed);
    socket.on('order_status_changed', onOrderStatusChanged);
    socket.on('order_completed', ({ orderId }) => {
      setMyOrders(prev => prev.filter(o => o.id !== orderId));
    });

    // Cleanup on unmount
    return () => {
      socket.off('order_created', onOrderCreated);
      socket.off('order_claimed', onOrderClaimed);
      socket.off('order_status_changed', onOrderStatusChanged);
      socket.off('order_completed');
    };
  }, [user, setAvailableOrders, setMyOrders]);

  // Handle claiming an available order
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
  
  // Handle completing an order
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

  // Update order status
  const updateOrderStatus = (orderId, newStatus) => {
    setMyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    fetch(`/api/driver/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update order status.');
      return res.json();
    })
    .then(updated => {
      setMyOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setError('');
      // If delivered, remove from claimed list
      if (newStatus === 'delivered') {
        setMyOrders(prev => prev.filter(o => o.id !== orderId));
      }
    })
    .catch(err => {
      console.error(err);
      setError(err.message);
      fetchData(false);
    });
  };

  // Handle driver availability toggle
  const handleAvailabilityToggle = () => {
    const newStatus = !isAvailable;
    setError('');

    fetch('/api/driver/availability', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: newStatus })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update status.');
      return res.json();
    })
    .then(updatedUser => {
      setIsAvailable(updatedUser.is_available);
    })
    .catch(err => {
      console.error(err);
      setError(err.message);
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="page-container">
        <Header />
        <main className="page-main">Loading driver data...</main>
      </div>
    );
  }

  // Outline of the following frontend components generated by AI:
  // Render driver dashboard
  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
        {error && <div className="driver-error-message">{error}</div>}

        {/* --- DRIVER STATUS SECTION --- */}
        <section className={`driver-section driver-status-section ${isAvailable ? 'status-online' : 'status-offline'}`}>
          <div className="status-text">
            <h2>You are currently {isAvailable ? 'Online' : 'Offline'}</h2>
            <p>
              {isAvailable 
                ? 'You will be shown available orders as they come in.' 
                : 'Go online to start receiving new order notifications.'
              }
            </p>
          </div>
          <button 
            className={`action-button ${isAvailable ? 'action-button-offline' : 'action-button-online'}`}
            onClick={handleAvailabilityToggle}
          >
            {isAvailable ? 'Go Offline' : 'Go Online'}
          </button>
        </section>
        {/* --- END OF NEW SECTION --- */}

        {/* --- ORDERS SECTIONS --- */}
        <section className="driver-section">
          <h2>My Claimed Orders ({myOrders.length})</h2>
          <div className="order-list">
            {myOrders.length === 0 ? (
              <p className="no-orders-message">You have not claimed any orders yet.</p>
            ) : (
              myOrders.map(order => (
                <div key={order.id} className="order-card claimed">
                  <h3>
                    Order for {order.customer_name}
                    {(() => {
                      const cls = statusClass(order.status);
                      return (
                        <span className={`status-tag status-${cls}`} style={{ marginLeft: 10 }}>
                          {formatStatus(order.status)}
                        </span>
                      );
                    })()}
                  </h3>
                  <p><strong>Order #:</strong> {order.princeton_order_number}</p>
                  <p><strong>Deliver To:</strong> {renderDeliveryAddress(order)}</p>
                  <p><strong>Contact:</strong> 
                    {order.customer_phone ? (
                      <a href={formatPhoneForTel(order.customer_phone)}>{formatPhoneForDisplay(order.customer_phone)}</a>
                    ) : (
                      'Not Provided'
                    )}
                  </p>
                  <p className="order-tip">Tip: ${parseFloat(order.tip_amount).toFixed(2)}</p>
                  <p className="order-time">Placed at: {formatTime(order.created_at)}</p>
                  <div className="order-actions">
                        {order.status === 'claimed' && (
                          <button className="action-button" onClick={() => updateOrderStatus(order.id, 'picked_up')}>Mark as Picked Up</button>
                        )}
                        {order.status === 'picked_up' && (
                          <>
                            <button className="action-button" onClick={() => updateOrderStatus(order.id, 'en_route')}>Mark as On the Way</button>
                            <button className="action-button-complete" onClick={() => updateOrderStatus(order.id, 'delivered')}>Mark as Delivered</button>
                          </>
                        )}
                        {order.status === 'en_route' && (
                          <button className="action-button-complete" onClick={() => updateOrderStatus(order.id, 'delivered')}>Mark as Delivered</button>
                        )}
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
                  <h3>
                    Order for {order.customer_name}
                    {(() => {
                      const cls = statusClass(order.status);
                      return (
                        <span className={`status-tag status-${cls}`} style={{ marginLeft: 10 }}>
                          {formatStatus(order.status)}
                        </span>
                      );
                    })()}
                  </h3>
                  <p><strong>Order #:</strong> {order.princeton_order_number}</p>
                  <p><strong>Deliver To:</strong> {renderDeliveryAddress(order)}</p>
                  <p><strong>Contact:</strong> {order.customer_phone ? (
                      <a href={formatPhoneForTel(order.customer_phone)}>{formatPhoneForDisplay(order.customer_phone)}</a>
                    ) : (
                      'Not Provided'
                    )}</p>
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
      <footer className="page-footer">
        UniEats &copy; 2025
      </footer>
    </div>
  );
}

export default DriverDashboard;