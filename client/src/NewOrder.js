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
  const [tip, setTip] = useState(0);
  const [buildingOptions, setBuildingOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [availableDriverCount, setAvailableDriverCount] = useState(0); 
  const navigate = useNavigate();
  const location = useLocation(); 

  const backUrl = location.state?.from || '/student-dashboard';

  const receiptEmail = 'UniEats.OrderReceipts@gmail.com';
  const princetonUrl = 'https://princeton.buy-ondemand.com/';
  const [copiedEmail, setCopiedEmail] = useState(false);

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
    // 1. First, check if the app is "online"
    fetch('/api/app-status')
      .then(res => res.json())
      .then(data => {
        setAvailableDriverCount(data.availableDriverCount);
        if (data.availableDriverCount > 0) {
          // 2. If online, fetch profile and buildings
          return Promise.all([
            fetch('/profile'),
            fetch('/api/buildings')
          ]);
        }
        // If offline, stop here
        return Promise.reject('offline'); 
      })
      .then(([profileRes, buildingsRes]) => {
        if (!profileRes.ok) throw new Error('Not authenticated');
        if (!buildingsRes.ok) throw new Error('Failed to fetch buildings');
        
        return Promise.all([profileRes.json(), buildingsRes.json()]);
      })
      .then(([user, buildingNames]) => {
        // We are online and all data is fetched
        setBuilding(user.dorm_building || '');
        setRoom(user.dorm_room || '');
        const options = buildingNames.map(name => ({ label: name, value: name }));
        setBuildingOptions(options);
      })
      .catch(err => {
        if (err === 'offline') {
          console.log('App is offline. No drivers available.');
        } else if (err.message.includes('authenticated')) {
          navigate('/'); // Redirect home if not logged in
        } else {
          console.error("Error fetching order page data:", err);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return; 
    setIsSubmitting(true);
    setStatusMessage('Placing your order...');
    
    const orderData = {
      princeton_order_number: orderNumber,
      delivery_building: building,
      delivery_room: room,
      tip_amount: tip
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
      <div className="page-container">
        <Header />
        <main className="page-main">Loading...
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
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
                <strong>Step 1:</strong> Go to the official Princeton ordering site: {' '}
                <a href={princetonUrl} target="_blank" rel="noopener noreferrer">{princetonUrl}</a>
              </p>
              <p>
                <strong>Step 2:</strong> In the email field, please enter{' '}
                <strong>
                  <button type="button" className="copy-email" onClick={copyEmail}>{receiptEmail}</button>
                </strong>
                {copiedEmail && <span className="copied-badge">Copied!</span>}.
                This redirects the confirmation to our system.
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
                  <label htmlFor="dorm_building">Building</label>
                  <Select
                    id="dorm_building"
                    classNamePrefix="react-select"
                    options={buildingOptions}
                    value={buildingOptions.find(o => o.value === building) || null}
                    onChange={(option) => setBuilding(option ? option.value : '')}
                    placeholder="Type or select a building..."
                    isClearable
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dorm_room">Room Number / Location</label>
                  <input
                    type="text"
                    id="dorm_room"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g., 301 or 'Firestone Lobby'"
                    required
                  />
                </div>
              </section>

              <section className="order-section">
                <h2>3. Tip Your Deliverer</h2>
                <div className="tip-buttons">
                  {[1, 2, 3, 5].map((amount) => (
                    <button
                      type="button"
                      key={amount}
                      className={`tip-button ${tip === amount ? 'selected' : ''}`}
                      onClick={() => setTip(amount)}
                    >
                      ${amount}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`tip-button ${tip === 0 ? 'selected' : ''}`}
                    onClick={() => setTip(0)}
                  >
                    No Tip
                  </button>
                </div>
              </section>
              
              <section className="order-section">
                <h2>4. Payment (Mock-up)</h2>
                <div className="payment-summary">
                  <p>Order Total: <span>(From Princeton)</span></p>
                  <p>Service Fee: <span>$0.50</span></p>
                  <p>Tip: <span>${tip.toFixed(2)}</span></p>
                  <hr/>
                  <p className="total"><strong>Total:</strong> <span>(Mock Total)</span></p>
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