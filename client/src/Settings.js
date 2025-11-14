// client/src/Settings.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // 1. Import useLocation
import Select from 'react-select'; 
import './Settings.css';
import Header from './Header';

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
  
  const [buildingOptions, setBuildingOptions] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // 2. Get location info

  // 3. Set the 'back' URL based on the state passed from the previous page
  const backUrl = location.state?.from || '/student-dashboard';

  useEffect(() => {
    let profileLoaded = false;
    let buildingsLoaded = false;
    const checkAllLoaded = () => {
      if (profileLoaded && buildingsLoaded) setIsLoading(false);
    };

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

    fetch('/api/buildings?type=' + encodeURIComponent('Residential College'))
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch buildings');
        return res.json();
      })
      .then(buildingNames => {
        const options = buildingNames.map(name => ({ label: name, value: name }));
        setBuildingOptions(options);
        buildingsLoaded = true;
        checkAllLoaded();
      })
      .catch(error => {
        console.error("Error fetching buildings:", error);
        buildingsLoaded = true; 
        checkAllLoaded();
      });

  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBuildingChange = (selectedOption) => {
    setFormData(prevData => ({
      ...prevData,
      dorm_building: selectedOption ? selectedOption.value : ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage('Saving...');
    fetch('/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    return (
      <div className="page-container settings-page">
        <Header />
        <main className="page-main">Loading...</main>
      </div>
    );
  }

  const selectedBuildingValue = buildingOptions.find(
    option => option.value === formData.dorm_building
  ) || null;

  return (
    <div className="page-container settings-page">
      <Header />
      <main className="page-main">
        <header className="settings-header">
          <h1>Profile & Settings</h1>
          {/* 4. Use the dynamic backUrl */}
          <Link to={backUrl} className="back-link">&larr; Back</Link>
        </header>

        <form onSubmit={handleSubmit} className="settings-form">
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

        <section className="settings-section">
          <h2>Delivery Address</h2>
          <div className="form-group">
            <label htmlFor="dorm_building">Dorm Building</label>
            <Select
              id="dorm_building"
              name="dorm_building"
              classNamePrefix="react-select"
              options={buildingOptions}
              value={selectedBuildingValue}
              onChange={handleBuildingChange}
              placeholder="Select a building..."
              isSearchable={false}
              isClearable
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
        
        <div className="form-actions">
          <button type="submit" className="save-button">Save Settings</button>
          {statusMessage && <span className="status-message">{statusMessage}</span>}
        </div>
        </form>
      </main>
    </div>
  );
}

export default Settings;