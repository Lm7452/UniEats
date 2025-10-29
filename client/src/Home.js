// src/components/Home.js or src/pages/Home.js

import React from 'react';
import './Home.css'; // Import the CSS file

function Home() {
  // Use the environment variable for the backend URL
  // Note: For Heroku, this will be empty, so requests go to the same origin.
  const BACKEND_URL = process.env.REACT_APP_API_URL || ''; 

  // Function to handle "How it works" button click (for future implementation)
  const handleHowItWorksClick = () => {
    // You can add logic here to scroll to a section,
    // or navigate to an info page.
    console.log("How it works button clicked!");
  };

  return (
    <div className="home-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-logo">
          {/* Using an emoji for the fork/spoon for now, or you can add an image */}
          <span role="img" aria-label="utensils">🍴</span> UniEats
        </div>
        <a href={`${BACKEND_URL}/login`} className="login-button-nav">
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

      {/* Footer */}
      <footer className="footer">
        <p>UniEats &copy; 2025</p>
        {/* Add more footer links here */}
      </footer>
    </div>
  );
}

export default Home;
