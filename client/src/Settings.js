// client/src/Settings.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select'; // <-- IMPORTED
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
  
  // New state for the building dropdown options
  const [buildingOptions, setBuildingOptions] = useState([]);
  
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch current user data and building list on load
  useEffect(() => {
    let profileLoaded = false;
    let buildingsLoaded = false;

    const checkAllLoaded = () => {
      if (profileLoaded && buildingsLoaded) {
        setIsLoading(false);
      }
    };

    // 1. Fetch user's profile
    fetch('/profile')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(user => {
        setFormData({
          name: user.name || '',
          email: user.email || '', 
          dorm_building: user.dorm_building || '',
          dorm_room: user.dorm_room || '',
          phone_number: user.phone_number || '',
          notify_email_order_status: user.notify_email_order_status,
          notify_email_promotions: user.notify_email_promotions,
        });
        profileLoaded = true;
        checkAllLoaded();
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
        navigate('/');
      });

    // 2. Fetch building list
    fetch('/api/buildings')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch buildings');
        return res.json();
      })
      .then(buildingNames => {
        // Map the array of strings to an array of { label, value } objects
        const options = buildingNames.map(name => ({ label: name, value: name }));
        setBuildingOptions(options);
        buildingsLoaded = true;
        checkAllLoaded();
      })
      .catch(error => {
        console.error("Error fetching buildings:", error);
        // We can still load the page, the dropdown will just be empty
        buildingsLoaded = true; 
        checkAllLoaded();
      });

  }, [navigate]);

  // Handle standard form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle the new react-select component change
  const handleBuildingChange = (selectedOption) => {
    setFormData(prevData => ({
      ...prevData,
      // Set dorm_building to the selected value, or an empty string if cleared
      dorm_building: selectedOption ? selectedOption.value : ''
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
      if (data.error) throw new Error(data.error);
      setStatusMessage('Settings saved successfully!');
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

  // Find the currently selected building object for the Select's value prop
  const selectedBuildingValue = buildingOptions.find(
    option => option.value === formData.dorm_building
  ) || null;

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
            {/* --- THIS IS THE NEW COMPONENT --- */}
            <Select
              id="dorm_building"
              name="dorm_building"
              classNamePrefix="react-select"
              options={buildingOptions}
              value={selectedBuildingValue}
              onChange={handleBuildingChange}
              placeholder="Type or select a building..."
              isClearable
            />
            {/* --- END OF NEW COMPONENT --- */}
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