// src/Home.js (Updated)

import React from 'react';
import './Home.css'; // Import the CSS file for the hero section
import Header from './Header'; // --- IMPORT YOUR REUSABLE HEADER ---

function Home() {
  // Function to handle "How it works" button click (for future implementation)
  const handleHowItWorksClick = () => {
    // You can add logic here to scroll to a section,
    // or navigate to an info page.
    console.log("How it works button clicked!");
  };

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
        <button onClick={handleHowItWorksClick} className="how-it-works-button">
          How it works
        </button>
      </section>

      {/* Placeholder for other sections like "Featured Content" / "Value Proposition" */}
      {/* This is where you would add the cards as described in our previous design chat */}
      <section className="value-props-section">
        {/* Example: */}
        {/* <div className="value-prop-card">
          <h3>Delivered by Students</h3>
          <p>Friendly, reliable delivery right to your door, every time.</p>
        </div> */}
        {/* ... more cards ... */}
      </section>

      {/* Footer (This stays the same) */}
      <footer className="footer">
        <p>UniEats &copy; 2025</p>
        {/* Add more footer links here */}
      </footer>
    </div>
  );
}

export default Home;