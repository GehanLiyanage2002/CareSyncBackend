const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Configuration parameters
const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'caresync',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

// If in production, secure connection might be required
if (isProduction) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

// Listen to pool events for monitoring
pool.on('connect', () => {
  console.log('Database pool connected successfully.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
