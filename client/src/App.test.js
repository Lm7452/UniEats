import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter

// Wrap App in BrowserRouter for tests since it uses <Routes>
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

test('renders home page by default', () => {
  renderWithRouter(<App />);
  // Check for text from your Home.js component
  expect(screen.getByText(/Your Campus. Your Cravings. Delivered./i)).toBeInTheDocument();
});
