// client/src/NewOrder.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; 
import Header from './Header'; // <-- THIS IS THE FIX
import Select from 'react-select';
import './NewOrder.css'; 

function NewOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [locationType, setLocationType] = useState(''); // '', 'residential', 'upperclassmen' or 'campus'
  const [residenceHall, setResidenceHall] = useState('');
  const [campusBuildingText, setCampusBuildingText] = useState('');
  const [campusRoomText, setCampusRoomText] = useState('');
  const [tip, setTip] = useState('');
  const [buildingOptions, setBuildingOptions] = useState([]);
  const [residentialOptionsCache, setResidentialOptionsCache] = useState([]);
  const [upperclassOptionsCache, setUpperclassOptionsCache] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [availableDriverCount, setAvailableDriverCount] = useState(0); 
  const navigate = useNavigate();
  const location = useLocation(); 

  const locationOptions = [
    { value: 'residential', label: 'Residential College' },
    { value: 'upperclassmen', label: 'Upperclassmen' },
    { value: 'campus', label: 'Campus Building' }
  ];

  const backUrl = location.state?.from || '/student-dashboard';

  const receiptEmail = 'UniEats.OrderReceipts@gmail.com';
  const princetonUrl = 'https://princeton.buy-ondemand.com/';
  const [copiedEmail, setCopiedEmail] = useState(false);
  const displayDomain = 'princeton.buy-ondemand.com';

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(receiptEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1800);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  useEffect(() => {
    // 1. First, check if the app is "online" and fetch profile/buildings when available
    fetch('/api/app-status')
      .then(res => res.json())
      .then(data => {
        setAvailableDriverCount(data.availableDriverCount);
        if (data.availableDriverCount > 0) {
          // If online, fetch profile and both building lists so switching types is instant
          return Promise.all([
            fetch('/profile'),
            fetch('/api/buildings?type=' + encodeURIComponent('Residential College')),
            fetch('/api/buildings?type=' + encodeURIComponent('Upperclassmen Hall'))
          ]);
        }
        // If offline, stop here
        return Promise.reject('offline');
      })
      .then(([profileRes, buildingsRes, upperRes]) => {
        if (!profileRes.ok) throw new Error('Not authenticated');
        if (!buildingsRes.ok) throw new Error('Failed to fetch residential buildings');
        if (!upperRes.ok) throw new Error('Failed to fetch upperclassmen buildings');
        return Promise.all([profileRes.json(), buildingsRes.json(), upperRes.json()]);
      })
      .then(([user, residentialNames, upperNames]) => {
        // We are online and all data is fetched
        setBuilding(user.dorm_building || '');
        setRoom(user.dorm_room || '');
        // If profile has a dorm_building, preselect residential; otherwise leave empty
        if (user.dorm_building) {
          setLocationType('residential');
        } else {
          setLocationType('');
        }
        const resOptions = residentialNames.map(name => ({ label: name, value: name }));
        const upOptions = upperNames.map(name => ({ label: name, value: name }));
        setResidentialOptionsCache(resOptions);
        setUpperclassOptionsCache(upOptions);
        // Set initial building options based on preselected locationType (or residential by default)
        if (user.dorm_building) {
          setBuildingOptions(resOptions);
        } else {
          setBuildingOptions(resOptions);
        }
      })
      .catch(err => {
        if (err === 'offline') {
          console.log('App is offline. No drivers available.');
        } else if (err.message && err.message.includes('authenticated')) {
          navigate('/'); // Redirect home if not logged in
        } else {
          console.error('Error fetching order page data:', err);
        }
      })
      .finally(() => setIsLoading(false));

  }, [navigate]);

  // When the selected location type changes (residential vs upperclassmen), reload options
  useEffect(() => {
    if (!locationType || locationType === 'campus') return; // campus uses free-text
    // If we already prefetched the list, use it
    if (locationType === 'residential' && residentialOptionsCache.length > 0) {
      setBuildingOptions(residentialOptionsCache);
      return;
    }
    if (locationType === 'upperclassmen' && upperclassOptionsCache.length > 0) {
      setBuildingOptions(upperclassOptionsCache);
      return;
    }
    const typeName = locationType === 'residential' ? 'Residential College' : 'Upperclassmen Hall';
    fetch('/api/buildings?type=' + encodeURIComponent(typeName))
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch buildings for type');
        return res.json();
      })
      .then(buildingNames => {
        const options = buildingNames.map(name => ({ label: name, value: name }));
        setBuildingOptions(options);
        if (locationType === 'residential') setResidentialOptionsCache(options);
        if (locationType === 'upperclassmen') setUpperclassOptionsCache(options);
      })
      .catch(err => {
        console.error('Error fetching buildings by type:', err);
      });
  }, [locationType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return; 
    setIsSubmitting(true);
    setStatusMessage('Placing your order...');
    if (!locationType) {
      setStatusMessage('Please select a delivery location type.');
      setIsSubmitting(false);
      return;
    }
    // Basic client-side validation for delivery address
    if (locationType !== 'campus') {
      if (!building) {
        setStatusMessage('Please select your residential college/building.');
        setIsSubmitting(false);
        return;
      }
      // residenceHall is required only for residential (not upperclassmen)
      if (locationType === 'residential' && !residenceHall) {
        setStatusMessage('Please enter your hall/section.');
        setIsSubmitting(false);
        return;
      }
      if (!room) {
        setStatusMessage('Please enter your room number.');
        setIsSubmitting(false);
        return;
      }
    } else {
      if (!campusBuildingText) {
        setStatusMessage('Please enter the campus building name.');
        setIsSubmitting(false);
        return;
      }
      if (!campusRoomText) {
        setStatusMessage('Please enter the room/location within the campus building.');
        setIsSubmitting(false);
        return;
      }
    }

    const orderData = {
      princeton_order_number: orderNumber,
      location_type: locationType,
      delivery_building: locationType === 'residential' ? building : campusBuildingText,
      delivery_room: locationType === 'residential' ? room : campusRoomText,
      residence_hall: locationType === 'residential' ? residenceHall : undefined,
      tip_amount: Number(tip) || 0
    };

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
    .then(res => {
      if (!res.ok) {
        // Handle 503 Service Unavailable (e.g., all drivers just went offline)
        if (res.status === 503) {
          throw new Error('No drivers are available. Please try again later.');
        }
        return res.json().then(err => { throw new Error(err.error || 'Server error') });
      }
      return res.json();
    })
    .then(newOrder => {
      console.log('Order created:', newOrder);
      setStatusMessage('Order placed successfully!');
      setTimeout(() => {
        navigate(backUrl); 
      }, 1500);
    })
    .catch(err => {
      console.error('Error placing order:', err);
      setStatusMessage(`Error: ${err.message}.`);
      setIsSubmitting(false);
      // Re-check driver status if the order failed
      fetch('/api/app-status').then(res=>res.json()).then(data => setAvailableDriverCount(data.availableDriverCount));
    });
  };


  if (isLoading) {
    return (
      <div className="page-container order-form-page">
        <Header />
        <main className="page-main">Loading...
        </main>
      </div>
    );
  }

  return (
    <div className="page-container order-form-page">
      <Header />
      <main className="page-main">
        <header className="new-order-header" style={{border: 'none', padding: 0, marginBottom: '25px'}}>
          <h1>Place New Order</h1>
          <Link to={backUrl} className="back-link">&larr; Back</Link>
        </header>

        {availableDriverCount > 0 ? (
          <>
            <div className="instruction-box">
              <h3>How to Order:</h3>
              <p>
                <strong>Step 1:</strong> Go to the official Frist Grill Ordering Form:{' '}
                <span className="form-link-inline"> 
                  <a href={princetonUrl} target="_blank" rel="noopener noreferrer" className="copy-email">{displayDomain}</a>
                </span>
              </p>
              <p>
                <strong>Step 2:</strong> In the email field, please enter{' '}
                <span className="email-inline">
                  <strong>
                    <button type="button" className="copy-email" onClick={copyEmail}>{receiptEmail}</button>
                  </strong>
                  {copiedEmail && <span className="copied-badge">Copied!</span>}
                </span>
                {' '}This redirects the confirmation to our system.
              </p>
              <p>
                <strong>Step 3:</strong> After paying, copy your Order Number (e.g., #12345) and paste it below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="new-order-form">
              
              <section className="order-section">
                <h2>1. Order Details</h2>
                <div className="form-group">
                  <label htmlFor="orderNumber">Princeton Order Number</label>
                  <input
                    type="text"
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g., #12345 or 98765"
                    required
                  />
                </div>
              </section>

              <section className="order-section">
                <h2>2. Delivery Address</h2>
                <div className="form-group">
                  <label htmlFor="locationType">Location Type</label>
                    {/* Use react-select so the control matches the Residential College control and is not typable */}
                    {(() => {
                      const locOptions = [
                        { value: 'residential', label: 'Residential College' },
                        { value: 'upperclassmen', label: 'Upperclassmen' },
                        { value: 'campus', label: 'Campus Building' }
                      ];
                      const selected = locOptions.find(o => o.value === locationType) || null;
                      return (
                        <Select
                          id="locationType"
                          classNamePrefix="react-select"
                          options={locOptions}
                          value={selected}
                          onChange={(opt) => setLocationType(opt ? opt.value : '')}
                          placeholder="-- Select location type --"
                          isClearable={false}
                          isSearchable={false}
                        />
                      );
                    })()}
                </div>

                {locationType ? (
                  locationType !== 'campus' ? (
                  <>
                    <div className="form-group">
                      <label htmlFor="dorm_building">Residential College</label>
                      <Select
                        id="dorm_building"
                          classNamePrefix="react-select"
                          className="dorm-select"
                        options={buildingOptions}
                        value={buildingOptions.find(o => o.value === building) || null}
                        onChange={(option) => setBuilding(option ? option.value : '')}
                        placeholder="Choose your residential college..."
                        isClearable
                      />
                    </div>
                    {/* Only show Hall / Section for residential (not upperclassmen) */}
                    {locationType === 'residential' && (
                      <div className="form-group">
                        <label htmlFor="residenceHall">Hall / Section</label>
                        <input
                          type="text"
                          id="residenceHall"
                          value={residenceHall}
                          onChange={(e) => setResidenceHall(e.target.value)}
                          placeholder="e.g., Quad A, Butler Hall"
                          required={locationType === 'residential'}
                        />
                      </div>
                    )}
                    <div className="form-group">
                      <label htmlFor="dorm_room">Room Number</label>
                      <input
                        type="text"
                        id="dorm_room"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        placeholder="e.g., 301"
                        required={locationType !== 'campus'}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label htmlFor="campus_building">Campus Building</label>
                      <input
                        type="text"
                        id="campus_building"
                        value={campusBuildingText}
                        onChange={(e) => setCampusBuildingText(e.target.value)}
                        placeholder="e.g., Lewis Library"
                        required={locationType === 'campus'}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="campus_room">Room / Location</label>
                      <input
                        type="text"
                        id="campus_room"
                        value={campusRoomText}
                        onChange={(e) => setCampusRoomText(e.target.value)}
                        placeholder="e.g., 2nd floor, Room 215"
                        required={locationType === 'campus'}
                      />
                    </div>
                  </>
                )) : null }
              </section>

              <section className="order-section">
                <h2>3. Tip Your Deliverer</h2>
                <div className="form-group">
                  <label htmlFor="tipAmount">Tip Amount (USD)</label>
                  <input
                    id="tipAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={tip}
                    onChange={(e) => setTip(e.target.value)}
                    placeholder="0.00"
                  />
                  <small className="help-text">Enter a tip amount for your deliverer.</small>
                </div>
              </section>
              
              <section className="order-section">
                <h2>4. Payment</h2>
                <div className="payment-summary">
                  <p>Service Fee: <span>$1.50</span></p>
                  <p>Tip: <span>${(Number(tip) || 0).toFixed(2)}</span></p>
                  <hr/>
                  <p className="total">
                    <strong>Total:</strong>
                    <span>${(1.5 + (Number(tip) || 0)).toFixed(2)}</span>
                  </p>
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Placing Order...' : 'Place Delivery Order'}
                  </button>
                  {statusMessage && <span className="status-message">{statusMessage}</span>}
                </div>
              </section>

            </form>
          </>
        ) : (
          <div className="app-offline-box">
            <h2>Ordering is Currently Offline</h2>
            <p>We're sorry, but there are no drivers available at the moment.</p>
            <p>Please check back again soon!</p>
          </div>
        )}
      </main>
      <footer className="page-footer">
        UniEats &copy; 2025
      </footer>
    </div>
  );
}

export default NewOrder;