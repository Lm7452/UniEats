import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Function to handle university login
  const handleUniversityLogin = () => {
    setLoading(true);
    
    // ============================================
    // YOUR UNIVERSITY AUTHENTICATION LOGIC HERE
    // ============================================
    // This is where you'll integrate with your university's authentication system
    // 
    // Common university authentication methods:
    // 1. OAuth 2.0 (Google, Microsoft Azure AD)
    // 2. SAML (Single Sign-On)
    // 3. CAS (Central Authentication Service)
    // 4. Shibboleth
    // 
    // Example implementations:
    // 
    // Option 1: OAuth with University Provider
    // window.location.href = 'https://university.edu/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_CALLBACK_URL';
    // 
    // Option 2: SAML SSO
    // window.location.href = '/api/auth/saml/login';
    // 
    // Option 3: CAS
    // window.location.href = 'https://cas.university.edu/login?service=YOUR_SERVICE_URL';
    //
    // After successful authentication, redirect to dashboard:
    // navigate('/dashboard');
    
    console.log('University login initiated...');
    
    // Placeholder: Show alert for now
    setTimeout(() => {
      setLoading(false);
      alert('University authentication not yet configured.\n\nAdd your university SSO/OAuth integration in LoginPage.js');
    }, 1000);
  };

  // Function to navigate back to home
  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="login-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo" onClick={handleBackToHome} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">🍴</span>
            <span className="logo-text">UniEats</span>
          </div>
          <button className="back-btn" onClick={handleBackToHome}>
            Back to Home
          </button>
        </div>
      </nav>

      {/* Login Section */}
      <main className="login-section">
        <div className="login-container">
          <h1 className="login-title">Welcome Back!</h1>
          <p className="login-subtitle">Sign in with your university account</p>

          {/* University Logo Placeholder */}
          <div className="university-logo">
            <div className="logo-placeholder">
              🎓
            </div>
            <p className="university-name">Your University</p>
          </div>

          {/* University Login Button */}
          <button 
            className="university-login-btn" 
            onClick={handleUniversityLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner">⏳ Connecting...</span>
            ) : (
              <>
                <span className="login-icon">🔐</span>
                Login with University Account
              </>
            )}
          </button>

          {/* Info Section */}
          <div className="login-info">
            <p className="info-text">
              <strong>For Students & Staff Only</strong>
            </p>
            <p className="info-text-small">
              Use your university credentials to access UniEats
            </p>
          </div>

          {/* Developer Note */}
        </div>
      </main>
    </div>
  );
}

export default LoginPage;