// src/Home.js (Updated)

import React, { useState } from 'react';
import './Home.css'; // Import the CSS file for the hero section
import Header from './Header'; // --- IMPORT YOUR REUSABLE HEADER ---

function Home() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="home-container">
      {/* --- USE THE REUSABLE HEADER COMPONENT --- */}
      <Header />

      {/* Hero Section (This part stays the same) */}
      <section className="hero-section">
        <h1 className="hero-title">Your Campus. Your Cravings. Delivered.</h1>
        <p className="hero-subtitle">
          Fresh meals from campus dining, brought right to your dorm.
        </p>
        <button
          onClick={() => setShowHowItWorks(true)}
          className="how-it-works-button"
        >
          How it works
        </button>
      </section>

      {/* How it works modal */}
      {showHowItWorks && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowHowItWorks(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} /* prevent overlay click from closing when clicking inside */
          >
            <div className="modal-header">
              <h2>How UniEats Delivery Works</h2>
              <button
                className="close-button"
                aria-label="Close"
                onClick={() => setShowHowItWorks(false)}
              >
                ×
              </button>
            </div>

            <p className="modal-subtitle">The whole process takes approximately <strong>15-25 minutes</strong> after placing your request.</p>

            <div className="modal-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-body">
                  <h3 className="step-title">Order from Princeton</h3>
                  <p>
                    Go to Frist Grill (or other campus dining) and place your order. <strong>IMPORTANT:</strong> Use placeholder@gmail.com for the contact email so we receive the confirmation.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-body">
                  <h3 className="step-title">Place Delivery Request</h3>
                  <p>
                    Come back to UniEats and use the 'Order Food Now!' button. You'll input your official Princeton Order Number, your specific delivery location (dorm/room), and add a tip for the driver.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-body">
                  <h3 className="step-title">Driver Claims Order</h3>
                  <p>
                    Our driver dashboard notifies available drivers. A nearby driver will claim your order and head to the dining location to pick it up.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">4</div>
                <div className="step-body">
                  <h3 className="step-title">Receive Delivery</h3>
                  <p>
                    The driver will message you via your provided phone number when they are outside your dorm or room. Enjoy your meal!
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="got-it-button"
                onClick={() => setShowHowItWorks(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder for other sections like "Featured Content" / "Value Proposition" */}
      <section className="value-props-section">
        {/* Example placeholder cards can be added here later */}
      </section>

      {/* Footer (This stays the same) */}
      <footer className="footer">
        <p>UniEats &copy; 2025</p>
      </footer>
    </div>
  );
}

export default Home;