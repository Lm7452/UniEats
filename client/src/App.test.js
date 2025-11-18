// client/src/App.test.js
// Test file for the main App component

import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; 

// Helper function to render with router context
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

// Basic test to ensure the App component renders without crashing
test('renders home page by default', () => {
  renderWithRouter(<App />);
  expect(screen.getByText(/Your Campus. Your Cravings. Delivered./i)).toBeInTheDocument();
});
