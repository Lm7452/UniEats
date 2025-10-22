import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  // Function to handle login button click
  const handleLoginClick = () => {
    navigate('/login');
  };

  // Function to handle "How it works" button (you can add functionality later)
  const handleHowItWorks = () => {
    // You can navigate to another page or show a modal
    console.log('How it works clicked!');
    // For now, it just logs to console
  };

  return (
    <div className="home-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">
            <span className="logo-icon">🍴</span>
            <span className="logo-text">UniEats</span>
          </div>
          <button className="login-btn" onClick={handleLoginClick}>
            Login
          </button>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Your Campus. Your Cravings. Delivered.
          </h1>
          <p className="hero-subtitle">
            Fresh meals from campus dining, brought right to your dorm.
          </p>
          <button className="how-it-works-btn" onClick={handleHowItWorks}>
            How it works
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>UniEats © 2025</p>
      </footer>
    </div>
  );
}

export default Home;