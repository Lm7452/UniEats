// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';
import Settings from './Settings';
import NewOrder from './NewOrder'; // <-- 1. IMPORT NEW COMPONENT

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/loginpage" element={<LoginPage />} /> 
        <Route path="/settings" element={<Settings />} />
        <Route path="/new-order" element={<NewOrder />} /> {/* <-- 2. ADD NEW ROUTE */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

