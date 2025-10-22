const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logging
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================
// API ROUTES - Define BEFORE static files
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'UniEats server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    version: '1.0.0'
  });
});

// Placeholder auth endpoints (returns dummy data for testing)
app.post('/api/auth/register', (req, res) => {
  res.json({ 
    success: true,
    message: 'Registration endpoint (no database yet)',
    user: { name: 'Test User', email: 'test@university.edu' }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ 
    success: true,
    message: 'Login endpoint (no database yet)',
    token: 'test-token-123'
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ 
    success: true,
    user: { name: 'Test User', email: 'test@university.edu' }
  });
});

// ============================================
// SERVE REACT APP IN PRODUCTION
// ============================================

if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  console.log('📦 Serving static files from:', buildPath);
  
  // Serve static assets
  app.use(express.static(buildPath));

  // Catch-all route for React Router
  // IMPORTANT: This must be LAST
  app.get('/*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).send('Error loading page');
      }
    });
  });
} else {
  // Development mode
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Server running in development mode',
      note: 'Start React app separately with: cd client && npm start',
      apiEndpoints: [
        '/api/health',
        '/api/test',
        '/api/auth/register',
        '/api/auth/login'
      ]
    });
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Test: http://localhost:${PORT}/api/test`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`   React App: http://localhost:${PORT}/`);
  }
  console.log('='.repeat(60));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('⚠  Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});