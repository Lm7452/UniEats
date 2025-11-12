// client/src/AdminCenter.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header'; 
import './AdminCenter.css'; 

function AdminCenter() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => {
        if (res.status === 403) throw new Error('You are not authorized to view this page.');
        if (!res.ok) throw new Error('Failed to fetch users.');
        return res.json();
      })
      .then(data => {
        setUsers(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching users:", err);
        setError(err.message);
        setIsLoading(false);
        if (err.message.includes('authorized')) {
          setTimeout(() => navigate('/student-dashboard'), 2000);
        }
      });
  }, [navigate]);

  // Fetch orders for admin view
  useEffect(() => {
    fetch('/api/admin/orders')
      .then(res => {
        if (res.status === 403) throw new Error('You are not authorized to view this page.');
        if (!res.ok) throw new Error('Failed to fetch orders.');
        return res.json();
      })
      .then(data => setOrders(data))
      .catch(err => console.error('Error fetching admin orders:', err));
  }, []);

  // Helper to update user state locally after an API call
  const updateLocalUser = (updatedUser) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? { ...user, ...updatedUser } : user
      )
    );
  };

  const removeLocalOrder = (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const handleDeleteOrder = (orderId) => {
    if (!window.confirm('Delete this order? This action cannot be undone.')) return;
    setStatusMessage('Deleting order...');
    fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete order.');
        return res.json();
      })
      .then(() => {
        removeLocalOrder(orderId);
        setStatusMessage('Order deleted.');
      })
      .catch(err => {
        console.error(err);
        setStatusMessage('Error deleting order.');
      });
  };

  const handleRoleChange = (userId, newRole) => {
    setStatusMessage('Updating role...');
    fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update role.');
      return res.json();
    })
    .then(updatedUser => {
      updateLocalUser(updatedUser);
      setStatusMessage(`User ${updatedUser.name} updated to ${updatedUser.role}.`);
    })
    .catch(err => {
      console.error(err);
      setStatusMessage('Error updating role.');
    });
  };

  // --- NEW HANDLER FOR AVAILABILITY ---
  const handleAvailabilityChange = (userId, newStatus) => {
    setStatusMessage('Updating availability...');
    fetch(`/api/admin/users/${userId}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: newStatus }),
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update availability.');
      return res.json();
    })
    .then(updatedUser => {
      updateLocalUser(updatedUser);
      setStatusMessage(`Driver ${updatedUser.name} set to ${newStatus ? 'Online' : 'Offline'}.`);
    })
    .catch(err => {
      console.error(err);
      setStatusMessage('Error updating availability.');
    });
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Header />
        <main className="page-main">Loading...</main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Header />
        <main className="page-main error-message">{error}</main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
        {statusMessage && <div className="status-message">{statusMessage}</div>}
        <section className="admin-section">
          <h2>Manage User Roles & Status</h2>
          <div className="user-table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Driver Status</th> {/* <-- NEW COLUMN */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-tag role-${user.role}`}>{user.role}</span>
                    </td>
                    {/* --- NEW DRIVER STATUS CELL --- */}
                    <td>
                      {user.role === 'driver' ? (
                        <span className={`status-tag ${user.is_available ? 'status-online' : 'status-offline'}`}>
                          {user.is_available ? 'Online' : 'Offline'}
                        </span>
                      ) : (
                        <span className="status-tag status-na">N/A</span>
                      )}
                    </td>
                    {/* --- END OF NEW CELL --- */}
                    <td className="actions-cell">
                      {user.role === 'driver' ? (
                        <>
                          <button 
                            className="action-button-secondary"
                            onClick={() => handleRoleChange(user.id, 'student')}
                          >
                            Set as Student
                          </button>
                          {/* --- NEW AVAILABILITY TOGGLE --- */}
                          <button
                            className={`action-button ${user.is_available ? 'action-button-offline' : 'action-button-online'}`}
                            onClick={() => handleAvailabilityChange(user.id, !user.is_available)}
                          >
                            {user.is_available ? 'Set Offline' : 'Set Online'}
                          </button>
                        </>
                      ) : (
                        <button 
                          className="action-button"
                          onClick={() => handleRoleChange(user.id, 'driver')}
                          disabled={user.role === 'admin'}
                        >
                          Set as Driver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="admin-section">
          <h2>Manage Orders</h2>
          <div className="order-table-container">
            <table className="order-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Order #</th>
                  <th>Delivery</th>
                  <th>Tip</th>
                  <th>Status</th>
                  <th>Placed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.customer_email}</td>
                    <td>{order.princeton_order_number}</td>
                    <td>{order.delivery_building} / {order.delivery_room}</td>
                    <td>${Number(order.tip_amount || 0).toFixed(2)}</td>
                    <td>{order.status}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td>
                      <button className="action-button-danger" onClick={() => handleDeleteOrder(order.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <footer className="page-footer">
        UniEats &copy; 2025
      </footer>
    </div>
  );
}

export default AdminCenter;