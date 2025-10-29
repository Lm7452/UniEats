// src/components/LoginPage.js

import React from 'react';

function LoginPage() {
  // The backend URL. Use an environment variable for this in a real app.
  // Note: For Heroku, this will be empty, so requests go to the same origin.
  const BACKEND_URL = process.env.REACT_APP_API_URL || ''; 

  return (
    <div>
      <h1>Welcome to UniEats</h1>
      <p>Please log in to continue.</p>
      
      {/* This is the key part. It's just a simple link! */}
      <a href={`${BACKEND_URL}/login`}>
        <button>Login with Princeton</button>
      </a>
    </div>
  );
}

export default LoginPage;
