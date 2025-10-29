// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage'; // Assuming you might add this route later

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* You can add a specific login page route if you don't redirect immediately */}
        <Route path="/loginpage" element={<LoginPage />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;

