// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import DashboardLanding from './DashboardLanding';
import StudentDashboard from './StudentDashboard';
import DriverDashboard from './DriverDashboard'; // <-- 1. IMPORT DRIVER DASHBOARD
import LoginPage from './LoginPage';
import Settings from './Settings';
import NewOrder from './NewOrder';
import AdminCenter from './AdminCenter';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<DashboardLanding />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/driver-dashboard" element={<DriverDashboard />} /> {/* <-- 2. ADD DRIVER ROUTE */}
        <Route path="/loginpage" element={<LoginPage />} /> 
        <Route path="/settings" element={<Settings />} />
        <Route path="/new-order" element={<NewOrder />} />
        <Route path="/admin" element={<AdminCenter />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;