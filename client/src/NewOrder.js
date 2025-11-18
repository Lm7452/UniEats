// client/src/NewOrder.js
// Main component for placing a new order with Stripe payment integration
// Includes form handling, validation, and dynamic back navigation
// Also includes clipboard copy functionality for support contact info

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Select from 'react-select';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import './NewOrder.css';

// Initialize Stripe outside of component to avoid recreating
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Main component for placing a new order
// Includes form handling, validation, and payment integration with Stripe
function NewOrder() {
  // Form state variables
  const [orderNumber, setOrderNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [locationType, setLocationType] = useState('');
  const [residenceHall, setResidenceHall] = useState('');
  const [campusBuildingText, setCampusBuildingText] = useState('');
  const [campusRoomText, setCampusRoomText] = useState('');
  const [tip, setTip] = useState('');
  const [promoCode, setPromoCode] = useState('');
  
  // Options for building and hall selects
  const [buildingOptions, setBuildingOptions] = useState([]);
  const [hallOptions, setHallOptions] = useState([]);
  const [residentialOptionsCache, setResidentialOptionsCache] = useState([]);
  const [upperclassOptionsCache, setUpperclassOptionsCache] = useState([]);
  
  // Loading and status states
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDriverCount, setAvailableDriverCount] = useState(0);
  
  // Payment state
  const [clientSecret, setClientSecret] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Navigation and routing
  const navigate = useNavigate();
  const location = useLocation();

  // Determine back URL after order completion
  const backUrl = location.state?.from || '/student-dashboard';
  
  // Constants
  const receiptEmail = 'UniEats.OrderReceipts@gmail.com';
  const supportNumber = '4344093218';
  const princetonUrl = 'https://princeton.buy-ondemand.com/';
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const displayDomain = 'princeton.buy-ondemand.com';

  // Calculate service fee based on promo code
  const promoAppliedLocally = promoCode && promoCode.trim().toLowerCase() === 'welcomebite';
  const displayedServiceFee = promoAppliedLocally ? 0.0 : 1.5;

  // Clipboard copy handlers
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(receiptEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1800);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(supportNumber);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 1800);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    // Fetch app status and user profile
    fetch('/api/app-status')
      .then(res => res.json())
      .then(data => {
        setAvailableDriverCount(data.availableDriverCount);
        // If drivers are available, fetch profile and building data
        if (data.availableDriverCount > 0) {
          return Promise.all([
            fetch('/profile'),
            fetch('/api/buildings?type=' + encodeURIComponent('Residential College')),
            fetch('/api/buildings?type=' + encodeURIComponent('Upperclassmen Hall'))
          ]);
        }
        return Promise.reject('offline');
      })
      .then(([profileRes, buildingsRes, upperRes]) => {
        if (!profileRes.ok) throw new Error('Not authenticated');
        if (!buildingsRes.ok) throw new Error('Failed to fetch residential buildings');
        if (!upperRes.ok) throw new Error('Failed to fetch upperclassmen buildings');
        return Promise.all([profileRes.json(), buildingsRes.json(), upperRes.json()]);
      })
      .then(([user, residentialNames, upperNames]) => {
        setUserProfile(user || null);
        const resOptions = residentialNames.map(name => ({ label: name, value: name }));
        const upOptions = upperNames.map(name => ({ label: name, value: name }));
        setResidentialOptionsCache(resOptions);
        setUpperclassOptionsCache(upOptions);
        setBuildingOptions(resOptions);
      })
      // Handle errors
      .catch(err => {
        if (err === 'offline') {
          console.log('App is offline. No drivers available.');
        } else if (err.message && err.message.includes('authenticated')) {
          navigate('/'); 
        } else {
          console.error('Error fetching order page data:', err);
        }
      })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  // Update building options when location type changes
  useEffect(() => {
    // Reset building and hall selections
    if (!locationType || locationType === 'campus') return;
    if (locationType === 'residential' && residentialOptionsCache.length > 0) {
      setBuildingOptions(residentialOptionsCache);
      return;
    }
    if (locationType === 'upperclassmen' && upperclassOptionsCache.length > 0) {
      setBuildingOptions(upperclassOptionsCache);
      return;
    }
    // Fetch building names for selected type
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
  }, [locationType, residentialOptionsCache, upperclassOptionsCache]);

  // Update hall options when building changes (for residential colleges)
  useEffect(() => {
    if (!building || locationType !== 'residential') {
      setHallOptions([]);
      setResidenceHall('');
      return;
    }
    const fetchHalls = async () => {
      try {
        const res = await fetch('/api/halls?location_name=' + encodeURIComponent(building));
        if (!res.ok) throw new Error('Failed to fetch halls');
        const names = await res.json();
        const opts = names.map(n => ({ label: n, value: n }));
        setHallOptions(opts);
      } catch (err) {
        console.error('Error fetching halls for building:', err);
        setHallOptions([]);
      }
    };
    fetchHalls();
  }, [building, locationType]);

  // Handle form submission to initiate payment
  const handleInitiatePayment = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setStatusMessage('Initializing payment...');
    setIsSubmitting(true);

    // Validate form inputs
    if (!orderNumber) {
      setStatusMessage('Please enter your Princeton order number.');
      setIsSubmitting(false);
      return;
    }
    if (!locationType) {
      setStatusMessage('Please select a delivery location type.');
      setIsSubmitting(false);
      return;
    }
    if (locationType !== 'campus') {
      if (!building) {
        setStatusMessage('Please select your residential college/building.');
        setIsSubmitting(false);
        return;
      }
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

    // Create Payment Intent on the server
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipAmount: tip, promoCode }),
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        throw new Error(data.error);
      }
      // Handle zero-amount orders
      if (data.zeroAmount) {
        setStatusMessage('No payment required — placing your order...');
        // Place order immediately without Stripe
        placeOrder(null, {
          phone: userProfile?.phone_number || null,
          email: userProfile?.email || null
        });
        return;
      }

      // Proceed to Stripe payment flow
      setClientSecret(data.clientSecret);
      setShowPaymentModal(true);
      setIsSubmitting(false);
      setStatusMessage('');
    })
    .catch((err) => {
      console.error("Error init payment:", err);
      setStatusMessage(`Payment Initialization Failed: ${err.message}`);
      setIsSubmitting(false);
    });
  };

  // Handle successful payment from CheckoutForm
  const handlePaymentSuccess = (paymentId, contactInfo = {}) => {
    setShowPaymentModal(false);
    setStatusMessage('Payment successful! Saving order...');
    setIsSubmitting(true);
    placeOrder(paymentId, contactInfo);
  };

  // Function to place order on the server
  const placeOrder = (stripePaymentId = null, contactInfo = {}) => {
    const orderData = {
      princeton_order_number: orderNumber,
      location_type: locationType,
      delivery_building: locationType !== 'campus' ? building : campusBuildingText,
      delivery_room: locationType !== 'campus' ? room : campusRoomText,
      residence_hall: locationType === 'residential' ? residenceHall : undefined,
      tip_amount: Number(tip) || 0,
      stripe_payment_id: stripePaymentId || undefined,
      promoCode: promoCode || undefined,
      customer_phone: contactInfo.phone || userProfile?.phone_number || null,
      customer_email: contactInfo.email || userProfile?.email || null
    };

    // Send order data to server
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
    .then(res => {
      if (!res.ok) {
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
      setIsSubmitting(false);
      setTimeout(() => {
        navigate(backUrl);
      }, 1500);
    })
    .catch(err => {
      console.error('Error placing order:', err);
      setStatusMessage(`Error: ${err.message}. Please contact support if you were charged.`);
      setIsSubmitting(false);
      fetch('/api/app-status').then(res=>res.json()).then(data => setAvailableDriverCount(data.availableDriverCount));
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="page-container order-form-page">
        <Header />
        <main className="page-main">Loading...</main>
      </div>
    );
  }

  // Outline of the following frontend components generated by AI:
  // Render main form
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
              <div
                role="alert"
                aria-live="polite"
                className="delivery-warning"
                style={{
                  color: '#a94442',
                  background: '#f2dede',
                  border: '1px solid #ebccd1',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  marginBottom: '12px',
                  fontWeight: 600
                }}
              >
                Notice: We are currently not offering delivery to E-Quad, Eating Clubs, or Forbes.
              </div>
              <p>
                <strong>Step 1:</strong> Go to the official Frist Grill Ordering Form:{' '}
                <span className="form-link-inline"> 
                  <a href={princetonUrl} target="_blank" rel="noopener noreferrer" className="copy-email">{displayDomain}</a>
                </span>
              </p>
              <p>
                <strong>Step 2:</strong> In the phone number field, please put in the following number:{' '}
                <span className="email-inline">
                  <strong>
                    <button type="button" className="copy-email" onClick={copyNumber}>{supportNumber}</button>
                  </strong>
                  {copiedNumber && <span className="copied-badge">Copied!</span>}
                </span>
                {' '}This redirects the confirmation to our system.
              </p>
              <p>
                <strong>Also:</strong> In the Frist Grill order form's <em>Name</em> field, please enter <strong>UniEats</strong>.
              </p>
              <p>
                <strong>Step 3:</strong> After paying, copy your Order Number (e.g., #12345) and paste it below.
              </p>
            </div>

            <form onSubmit={handleInitiatePayment} className="new-order-form">
              
              <section className="order-section">
                <h2>1. Order Details</h2>
                <div className="form-group">
                  <label htmlFor="orderNumber">Princeton Order Number</label>
                  <input
                    type="text"
                    id="orderNumber"
                    value={orderNumber}
                    inputMode="numeric"
                    pattern="\d*"
                    onChange={(e) => setOrderNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g., 12345"
                    required
                  />
                </div>
              </section>

              <section className="order-section">
                <h2>2. Delivery Address</h2>
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
                    value={[
                      { value: 'residential', label: 'Residential College' },
                      { value: 'upperclassmen', label: 'Upperclassmen' },
                      { value: 'campus', label: 'Campus Building' }
                    ].find(o => o.value === locationType) || null}
                    onChange={(opt) => setLocationType(opt ? opt.value : '')}
                    placeholder="-- Select location type --"
                    isClearable={false}
                    isSearchable={false}
                  />
                </div>

                {locationType ? (
                  locationType !== 'campus' ? (
                  <>
                    <div className="form-group">
                      <label htmlFor="dorm_building">{locationType === 'upperclassmen' ? 'Upperclassmen Hall' : 'Residential College'}</label>
                      <Select
                        id="dorm_building"
                        classNamePrefix="react-select"
                        className="dorm-select"
                        options={buildingOptions}
                        value={buildingOptions.find(o => o.value === building) || null}
                        onChange={(option) => setBuilding(option ? option.value : '')}
                        placeholder={locationType === 'upperclassmen' ? 'Choose your upperclassmen hall...' : 'Choose your residential college...'}
                        isClearable
                        isSearchable={false}
                      />
                    </div>
                    {locationType === 'residential' && (
                      <div className="form-group">
                        <label htmlFor="residenceHall">Hall / Section</label>
                        <Select
                          id="residenceHall"
                          classNamePrefix="react-select"
                          options={hallOptions}
                          value={hallOptions.find(o => o.value === residenceHall) || null}
                          onChange={(opt) => setResidenceHall(opt ? opt.value : '')}
                          placeholder="Choose your hall/section..."
                          isClearable
                          isSearchable={false}
                        />
                      </div>
                    )}
                    <div className="form-group">
                      <label htmlFor="dorm_room">Room Number</label>
                      <input
                        type="text"
                        id="dorm_room"
                        value={room}
                        inputMode="numeric"
                        pattern="\d*"
                        onChange={(e) => setRoom(e.target.value.replace(/\D/g, ''))}
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
                <div className="form-group">
                  <label htmlFor="promoCode">Promo Code (optional)</label>
                  <input
                    id="promoCode"
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code (if any)"
                  />
                  {promoCode && promoAppliedLocally && (
                    <small className="help-text">Promo looks like 'WelcomeBite' (applies only to first order).</small>
                  )}
                </div>
                <div className="payment-summary">
                  <p>Service Fee: <span>${displayedServiceFee.toFixed(2)}</span></p>
                  <p>Tip: <span>${(Number(tip) || 0).toFixed(2)}</span></p>
                  <hr/>
                  <p className="total">
                    <strong>Total:</strong>
                    <span>${(displayedServiceFee + (Number(tip) || 0)).toFixed(2)}</span>
                  </p>
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Loading...' : 'Proceed to Payment'}
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

        {/* --- STRIPE MODAL OVERLAY --- */}
        {showPaymentModal && clientSecret && (
          <div className="modal-overlay" style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              position: 'fixed', 
              top: 0, left: 0, right: 0, bottom: 0, 
              background: 'rgba(0,0,0,0.5)', 
              zIndex: 1000 
          }}>
            <div className="modal-content" style={{ 
                background: '#fff', 
                padding: '20px', 
                borderRadius: '8px', 
                width: '90%', 
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
              <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
                <CheckoutForm 
                  initialContact={{ phone: userProfile?.phone_number || '', email: userProfile?.email || '' }}
                  onPaymentSuccess={handlePaymentSuccess} 
                  onCancel={() => {
                    setShowPaymentModal(false);
                    setIsSubmitting(false);
                    setStatusMessage('');
                  }} 
                />
              </Elements>
            </div>
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