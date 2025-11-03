// client/src/NewOrder.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import './NewOrder.css'; // We will create this CSS file next

function NewOrder() {
  // Form state
  const [orderNumber, setOrderNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [tip, setTip] = useState(0);

  // Data state
  const [buildingOptions, setBuildingOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double-submit
  const navigate = useNavigate();

  // Fetch profile (for default address) and building list (for dropdown)
  useEffect(() => {
    let profileLoaded = false;
    let buildingsLoaded = false;

    const checkAllLoaded = () => {
      if (profileLoaded && buildingsLoaded) setIsLoading(false);
    };

    // 1. Fetch user's profile for default address
    fetch('/profile')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(user => {
        setBuilding(user.dorm_building || '');
        setRoom(user.dorm_room || '');
        profileLoaded = true;
        checkAllLoaded();
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
        navigate('/'); // Redirect to home if not logged in
      });

    // 2. Fetch building list
    fetch('/api/buildings')
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

  // Handle form submission (NOW REAL)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Don't submit twice

    setIsSubmitting(true);
    setStatusMessage('Placing your order...');
    
    const orderData = {
      princeton_order_number: orderNumber,
      delivery_building: building,
      delivery_room: room,
      tip_amount: tip
    };

    // Send the data to the new backend endpoint
    fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    })
    .then(res => {
      if (!res.ok) {
        // Handle server errors
        return res.json().then(err => { throw new Error(err.error || 'Server error') });
      }
      return res.json();
    })
    .then(newOrder => {
      console.log('Order created:', newOrder);
      setStatusMessage('Order placed successfully!');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard'); 
        // In the future, we can navigate to: navigate(`/orders/${newOrder.id}`);
      }, 1500);
    })
    .catch(err => {
      console.error('Error placing order:', err);
      setStatusMessage(`Error: ${err.message}. Please try again.`);
      setIsSubmitting(false);
    });
  };


  if (isLoading) {
    return <div className="new-order-container">Loading...</div>;
  }

  // Find the currently selected building object for the Select's value prop
  const selectedBuildingValue = buildingOptions.find(
    option => option.value === building
  ) || null;

  return (
    <div className="new-order-container">
      <header className="new-order-header">
        <h1>Place New Order</h1>
        <Link to="/dashboard" className="back-link">&larr; Back to Dashboard</Link>
      </header>

      {/* --- INSTRUCTIONS --- */}
      <div className="instruction-box">
        <h3>How to Order:</h3>
        <p>
          <strong>Step 1:</strong> Go to the official Princeton food order site.
        </p>
        <p>
          <strong>Step 2:</strong> In the email field, please enter <strong><code>placeholder@gmail.com</code></strong>. This redirects the confirmation to our system.
        </p>
        <p>
          <strong>Step 3:</strong> After paying, copy your Order Number (e.g., #12345) and paste it below.
        </p>
      </div>

      {/* --- ORDER FORM --- */}
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
              value={selectedBuildingValue}
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
    </div>
  );
}

export default NewOrder;