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
  const [residentialOptionsCache, setResidentialOptionsCache] = useState([]);
  const [upperclassOptionsCache, setUpperclassOptionsCache] = useState([]);
  const [hallOptions, setHallOptions] = useState([]);
  const [locationType, setLocationType] = useState(''); // 'residential' | 'upperclassmen' | 'campus'
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
          residence_hall: user.residence_hall || ''
        });
        profileLoaded = true;
        checkAllLoaded();
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
        navigate('/');
      });

    // Prefetch both Residential and Upperclassmen building lists for Settings
    const fetchResidential = fetch('/api/buildings?type=' + encodeURIComponent('Residential College'));
    const fetchUpper = fetch('/api/buildings?type=' + encodeURIComponent('Upperclassmen Hall'));
    fetchResidential
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch buildings');
        return res.json();
      })
      .then(buildingNames => {
        const options = buildingNames.map(name => ({ label: name, value: name }));
        setResidentialOptionsCache(options);
        buildingsLoaded = true; 
        checkAllLoaded();
      })
      .catch(error => {
        console.error("Error fetching residential buildings:", error);
        buildingsLoaded = true; checkAllLoaded();
      });

    fetchUpper
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch upperclassmen buildings');
        return res.json();
      })
      .then(buildingNames => {
        const options = buildingNames.map(name => ({ label: name, value: name }));
        setUpperclassOptionsCache(options);
        // If user has a dorm_building already, infer type
        buildingsLoaded = true; 
        checkAllLoaded();
      })
      .catch(error => {
        console.error("Error fetching upperclassmen buildings:", error);
        buildingsLoaded = true; checkAllLoaded();
      });
    

  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    if (name === 'dorm_room') {
      newValue = String(newValue).replace(/\D/g, '');
    }
    setFormData(prevData => ({
      ...prevData,
      [name]: newValue,
    }));
  };

  const handleLocationTypeChange = (opt) => {
    const val = opt ? opt.value : '';
    setLocationType(val);
    // set buildingOptions based on selection
    if (val === 'residential') {
      setBuildingOptions(residentialOptionsCache);
    } else if (val === 'upperclassmen') {
      setBuildingOptions(upperclassOptionsCache);
    } else {
      setBuildingOptions([]);
    }
    // clear building/hall/room when type changes
    setFormData(prev => ({ ...prev, dorm_building: '', dorm_room: '', residence_hall: '' }));
  };

  const handleBuildingChange = (selectedOption) => {
    const value = selectedOption ? selectedOption.value : '';
    setFormData(prevData => ({ ...prevData, dorm_building: value, residence_hall: '' }));
    // If residential, fetch halls for this building
    if (locationType === 'residential' && value) {
      fetch('/api/halls?location_name=' + encodeURIComponent(value))
        .then(res => res.ok ? res.json() : Promise.reject('Failed'))
        .then(names => setHallOptions(names.map(n => ({ label: n, value: n }))))
        .catch(err => { console.error('Error fetching halls:', err); setHallOptions([]); });
    } else {
      setHallOptions([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage('Saving...');
    // Include dorm_type and residence_hall where available. Server will ignore unknown fields if DB not migrated.
    const payload = {
      ...formData,
      dorm_type: locationType || undefined,
      residence_hall: formData.residence_hall || undefined
    };
    fetch('/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

  // Infer initial location type and populate buildingOptions once caches loaded
  useEffect(() => {
    if (!isLoading) {
      const building = formData.dorm_building || '';
      if (building) {
        const isUpper = upperclassOptionsCache.some(o => o.value === building);
        if (isUpper) {
          setLocationType('upperclassmen');
          setBuildingOptions(upperclassOptionsCache);
        } else {
          setLocationType('residential');
          setBuildingOptions(residentialOptionsCache);
        }
      } else {
        // default to residential options
        setLocationType('residential');
        setBuildingOptions(residentialOptionsCache);
      }
      // If we already have a building selected and locationType is residential, fetch halls
      if (formData.dorm_building && (locationType === 'residential' || !locationType)) {
        fetch('/api/halls?location_name=' + encodeURIComponent(formData.dorm_building))
          .then(res => res.ok ? res.json() : Promise.reject('Failed'))
          .then(names => setHallOptions(names.map(n => ({ label: n, value: n })) ))
          .catch(() => setHallOptions([]));
      }
    }
  }, [isLoading]);

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
            <label htmlFor="locationType">Location Type</label>
            <Select
              id="locationType"
              classNamePrefix="react-select"
              options={[
                { value: 'residential', label: 'Residential College' },
                { value: 'upperclassmen', label: 'Upperclassmen' },
                { value: 'campus', label: 'Campus Building' }
              ]}
              value={[{ value: locationType, label: locationType === 'upperclassmen' ? 'Upperclassmen' : locationType === 'campus' ? 'Campus Building' : 'Residential College' }].find(Boolean) || null}
              onChange={handleLocationTypeChange}
              isClearable={false}
              isSearchable={false}
            />
          </div>
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
          {locationType === 'residential' && (
            <div className="form-group">
              <label htmlFor="residence_hall">Hall / Section</label>
              <Select
                id="residence_hall"
                classNamePrefix="react-select"
                options={hallOptions}
                value={hallOptions.find(o => o.value === formData.residence_hall) || null}
                onChange={(opt) => setFormData(prev => ({ ...prev, residence_hall: opt ? opt.value : '' }))}
                placeholder="Choose your hall/section..."
                isSearchable={false}
                isClearable
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="dorm_room">Room Number</label>
            <input
              type="text"
              id="dorm_room"
              name="dorm_room"
              value={formData.dorm_room}
              inputMode="numeric"
              pattern="\d*"
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