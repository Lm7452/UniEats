// client/src/AdminCenter.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header'; 
import './AdminCenter.css'; // Still used for table/button styles

function AdminCenter() {
  const [users, setUsers] = useState([]);
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
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === updatedUser.id ? { ...user, role: updatedUser.role } : user
        )
      );
      setStatusMessage(`User ${updatedUser.name} updated to ${updatedUser.role}.`);
    })
    .catch(err => {
      console.error(err);
      setStatusMessage('Error updating role.');
    });
  };

  if (isLoading) {
    return (
      // --- UPDATED CLASSES ---
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
    {/* --- END OF UPDATE --- */}
        {statusMessage && <div className="status-message">{statusMessage}</div>}
        <section className="admin-section">
          <h2>Manage User Roles</h2>
          <div className="user-table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Current Role</th>
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
                    <td className="actions-cell">
                      {user.role === 'driver' ? (
                        <button 
                          className="action-button-secondary"
                          onClick={() => handleRoleChange(user.id, 'student')}
                        >
                          Set as Student
                        </button>
                      ) : (
                        <button 
                          className="action-button"
                          onClick={() => handleRoleChange(user.id, 'driver')}
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
      </main>
      {/* --- UPDATED CLASS --- */}
      <footer className="page-footer">
        UniEats &copy; 2025
      </footer>
    </div>
  );
}

export default AdminCenter;