// client/src/CheckoutForm.js
import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './NewOrder.css'; // Reuse existing styles

export default function CheckoutForm({ onPaymentSuccess, onCancel, initialContact = {} }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (initialContact) {
      if (initialContact.phone) setPhone(initialContact.phone);
      if (initialContact.email) setEmail(initialContact.email);
    }
  }, [initialContact]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // We don't redirect; we handle completion manually below if redirect="if_required"
        // But standard Stripe flow usually redirects. 
        // For this SPA, we use redirect: "if_required" if you configured it, 
        // or we just let Stripe handle the return url.
        // Ideally, set a return_url, but we can try to handle it inline for simple cards.
        return_url: window.location.origin + "/order-history",
      },
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Payment succeeded! Now place the order in our DB and include contact info
      onPaymentSuccess(paymentIntent.id, { phone, email });
    } else {
      setMessage("Unexpected state.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form-box">
      <h4>Contact Info</h4>
      <div className="form-group">
        <label htmlFor="cf_phone">Phone Number</label>
        <input
          id="cf_phone"
          type="text"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9+()-\s]/g, ''))}
          placeholder="e.g., 6095551234"
        />
      </div>
      <div className="form-group">
        <label htmlFor="cf_email">Email</label>
        <input
          id="cf_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <h3>Enter Card Details</h3>
      <PaymentElement />
      {message && <div className="error-message" style={{marginTop: '10px'}}>{message}</div>}
      
      <div className="form-actions" style={{justifyContent: 'flex-end', marginTop: '20px'}}>
        <button 
            type="button" 
            className="action-button-secondary" 
            onClick={onCancel} 
            disabled={isProcessing}
            style={{marginRight: '10px'}}
        >
          Cancel
        </button>
        <button 
            type="submit" 
            className="save-button" 
            disabled={isProcessing || !stripe || !elements}
        >
          {isProcessing ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </form>
  );
}