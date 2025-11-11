// src/Home.js 

import React, { useState } from 'react'; // Added useState
import './Home.css'; 

// --- NEW MODAL COMPONENT ---
function HowItWorksModal({ onClose }) {
  // Use colors defined in Home.css/root
  const steps = [
    { title: "1. Order from Princeton", text: "Go to Frist Grill (or other campus dining) and place your order. **IMPORTANT:** Use placeholder@gmail.com for the contact email so we receive the confirmation." },
    { title: "2. Place Delivery Request", text: "Come back to UniEats and use the 'Order Food Now!' button. You'll input your official Princeton Order Number, your specific delivery location (dorm/room), and add a tip for the driver." },
    { title: "3. Driver Claims Order", text: "Our driver dashboard notifies available drivers. A nearby driver will claim your order and head to the dining location to pick it up." },
    { title: "4. Receive Delivery", text: "The driver will message you via your provided phone number when they are outside your dorm or room. Enjoy your meal!" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">How UniEats Delivery Works</h2>
        <p className="modal-subtitle">
          The whole process takes approximately 15-25 minutes after placing your request.
        </p>
        
        <div className="modal-steps-container">
          {steps.map((step, index) => (
            <div key={index} className="modal-step">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-text">{step.text}</p>
            </div>
          ))}
        </div>
        
        <button onClick={onClose} className="modal-close-button">
          Got it!
        </button>
      </div>
    </div>
  );
}
// --- END OF NEW MODAL COMPONENT ---


function Home() {
  const [showModal, setShowModal] = useState(false); // State to control modal visibility

  const handleHowItWorksClick = () => {
    setShowModal(true); // Show the modal when button is clicked
  };

  return (
    <div className="home-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <span role="img" aria-label="utensils">🍴</span> UniEats
        </div>
        <a href="/login" className="login-button-nav">
          Login
        </a>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">Your Campus. Your Cravings. Delivered.</h1>
        <p className="hero-subtitle">
          Fresh meals from campus dining, brought right to your dorm.
        </p>
        <button onClick={handleHowItWorksClick} className="how-it-works-button">
          How it works
        </button>
      </section>

      {/* Placeholder for Value Propositions */}
      <section className="value-props-section">
        {/* Placeholder Content */}
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>UniEats &copy; 2025</p>
      </footer>
      
      {/* --- RENDER MODAL --- */}
      {showModal && <HowItWorksModal onClose={() => setShowModal(false)} />}
      
    </div>
  );
}

export default Home;