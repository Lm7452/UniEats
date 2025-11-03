// client/src/DashboardLanding.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DashboardLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the user's profile to get their role
    fetch('/profile')
      .then(res => {
        if (!res.ok) {
          // If not authenticated, send to home page
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then(user => {
        // --- THIS IS THE REDIRECT LOGIC ---
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'driver') {
          // We'll build this page next
          navigate('/driver-dashboard'); 
        } else {
          // Default to student dashboard
          navigate('/student-dashboard');
        }
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
        navigate('/'); // Send to home on any error
      });
  }, [navigate]); // Re-run if navigate function changes

  // Display a loading state while we figure out where to go
  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '1.5em' }}>
      Loading your dashboard...
    </div>
  );
}

export default DashboardLanding;