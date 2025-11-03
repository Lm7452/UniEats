// client/src/DriverDashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
// We'll create a DriverDashboard.css file later
// import './DriverDashboard.css'; 

function DriverDashboard() {
  // In the future, this will fetch /api/driver/orders
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '15px' }}>
        <h1>Driver Dashboard (Placeholder)</h1>
        <Link to="/admin" style={{ color: '#E77500', fontWeight: '500' }}>&larr; Back to Admin Center</Link>
      </header>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Available Orders</h2>
        <p>(Available orders will appear here.)</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>My Claimed Orders</h2>
        <p>(Your claimed orders will appear here.)</p>
      </div>
    </div>
  );
}

export default DriverDashboard;