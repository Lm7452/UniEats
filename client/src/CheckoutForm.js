// client/src/CheckoutForm.js
import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './NewOrder.css'; // Reuse existing styles

export default function CheckoutForm({ onPaymentSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      // Payment succeeded! Now place the order in our DB
      onPaymentSuccess(paymentIntent.id);
    } else {
      setMessage("Unexpected state.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form-box">
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