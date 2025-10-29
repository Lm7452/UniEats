// Backend server entry point
const express = require('express');
const path = require('path');
const app = express();

// Heroku assigns a port dynamically.
const PORT = process.env.PORT || 5000;

// Serve static files from the React build
// This is the crucial step to connect front and backend
app.use(express.static(path.join(__dirname, '../client/build')));

// A simple API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

// All other requests serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// This is the command that
// 1. Starts the server
// 2. Keeps it running (to avoid the H10 crash)
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

