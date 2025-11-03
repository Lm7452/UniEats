// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import DashboardLanding from './DashboardLanding'; // <-- 1. IMPORT LANDING PAGE
import StudentDashboard from './StudentDashboard'; // <-- 2. IMPORT RENAMED DASHBOARD
import LoginPage from './LoginPage';
import Settings from './Settings';
import NewOrder from './NewOrder';
import AdminCenter from './AdminCenter';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<DashboardLanding />} /> {/* <-- 3. ADDED 'SMART' ROUTE */}
        <Route path="/student-dashboard" element={<StudentDashboard />} /> {/* <-- 4. RENAMED ROUTE */}
        <Route path="/loginpage" element={<LoginPage />} /> 
        <Route path="/settings" element={<Settings />} />
        <Route path="/new-order" element={<NewOrder />} />
        <Route path="/admin" element={<AdminCenter />} />
        {/* We will add /driver-dashboard here soon */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;