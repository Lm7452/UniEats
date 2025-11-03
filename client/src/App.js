// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';
import Settings from './Settings'; // <-- ADDED THIS

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/loginpage" element={<LoginPage />} /> 
        <Route path="/settings" element={<Settings />} /> {/* <-- ADDED THIS */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;