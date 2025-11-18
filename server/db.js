// server/db.js
// Database connection setup using PostgreSQL and pg-pool

// Import pg Pool
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config(); 

// Create a new pool instance with connection parameters
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Log when connected or on error
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database!');
});

// Handle errors on the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export query function for executing SQL queries
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool
};
