// frontend/src/Dashboard.js
import React from 'react';

function Dashboard() {
  // Use the environment variable for the backend URL
  const BACKEND_URL = process.env.REACT_APP_API_URL;

  return (
    <div style={{ padding: '50px', color: 'white', backgroundColor: '#121212', height: '100vh' }}>
      <h1>Welcome to UniEats!</h1>
      <p>You are successfully logged in.</p>
      <a href={`${BACKEND_URL}/logout`}>
        <button>Logout</button>
      </a>
    </div>
  );
}

export default Dashboard;