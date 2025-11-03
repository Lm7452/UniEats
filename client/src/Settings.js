// client/src/Settings.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Settings.css';

function Settings() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dorm_building: '',
    dorm_room: '',
    phone_number: '',
    notify_email_order_status: true,
    notify_email_promotions: true,
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch current user data on load
  useEffect(() => {
    fetch('/profile')
      .then(res => {
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then(user => {
        // Set form data with user's current settings
        setFormData({
          name: user.name || '',
          email: user.email || '', // Email is read-only
          dorm_building: user.dorm_building || '',
          dorm_room: user.dorm_room || '',
          phone_number: user.phone_number || '',
          notify_email_order_status: user.notify_email_order_status,
          notify_email_promotions: user.notify_email_promotions,
        });
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
        // If not authenticated, redirect to login
        navigate('/');
      });
  }, [navigate]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage('Saving...');

    fetch('/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }
      setStatusMessage('Settings saved successfully!');
      // Update form data with any returned data (e.g., updated_at)
      setFormData(prevData => ({ ...prevData, ...data }));
    })
    .catch(err => {
      console.error('Error saving settings:', err);
      setStatusMessage('Error saving settings. Please try again.');
    });
  };

  if (isLoading) {
    return <div className="settings-container">Loading...</div>;
  }

  return (
    <div className="settings-container">
      <header className="settings-header">
        <h1>Profile & Settings</h1>
        <Link to="/dashboard" className="back-link">&larr; Back to Dashboard</Link>
      </header>

      <form onSubmit={handleSubmit} className="settings-form">
        
        {/* --- Profile Section --- */}
        <section className="settings-section">
          <h2>Profile</h2>
          
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email (read-only)</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">Phone Number</label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="e.g., 555-123-4567"
            />
          </div>
        </section>

        {/* --- Delivery Section --- */}
        <section className="settings-section">
          <h2>Delivery Address</h2>
          
          <div className="form-group">
            <label htmlFor="dorm_building">Dorm Building</label>
            <input
              type="text"
              id="dorm_building"
              name="dorm_building"
              value={formData.dorm_building}
              onChange={handleChange}
              placeholder="e.g., Mathey College"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="dorm_room">Room Number</label>
            <input
              type="text"
              id="dorm_room"
              name="dorm_room"
              value={formData.dorm_room}
              onChange={handleChange}
              placeholder="e.g., 301"
            />
          </div>
        </section>

        {/* --- Notifications Section --- */}
        <section className="settings-section">
          <h2>Email Notifications</h2>
          
          <div className="form-group-checkbox">
            <input
              type="checkbox"
              id="notify_email_order_status"
              name="notify_email_order_status"
              checked={formData.notify_email_order_status}
              onChange={handleChange}
            />
            <label htmlFor="notify_email_order_status">Order Status Updates</label>
          </div>
          
          <div className="form-group-checkbox">
            <input
              type="checkbox"
              id="notify_email_promotions"
      name="notify_email_promotions"
              checked={formData.notify_email_promotions}
              onChange={handleChange}
            />
            <label htmlFor="notify_email_promotions">Promotions & News</label>
          </div>
        </section>
        
        {/* --- Save Button --- */}
        <div className="form-actions">
          <button type="submit" className="save-button">Save Settings</button>
          {statusMessage && <span className="status-message">{statusMessage}</span>}
        </div>

      </form>
    </div>
  );
}

export default Settings;