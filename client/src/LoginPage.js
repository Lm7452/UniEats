// src/components/LoginPage.js

import React from 'react';
import Header from './Header';
import './LoginPage.css';

function LoginPage() {
  // The backend URL. Use an environment variable for this in a real app.
  const BACKEND_URL = process.env.REACT_APP_API_URL || '';

  return (
    <div className="loginpage-container">
      <Header />
      <main className="loginpage-main">
        <h1>Welcome to UniEats</h1>
        <p>Please log in to continue.</p>
        <a className="center-login-link" href={`${BACKEND_URL}/login`}>
          <button className="center-login-button">Login with Princeton</button>
        </a>
      </main>
    </div>
  );
}

export default LoginPage;
