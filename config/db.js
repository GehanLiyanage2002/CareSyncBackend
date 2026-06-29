const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Configuration parameters
const poolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10, // Prevent overloading Prisma's connection limits
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000
} : {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  max: 10,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000
};

// If in production, secure connection might be required
if (isProduction && !process.env.DATABASE_URL) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client', err);
});

/**
 * Robust function to test the database connection.
 * Attempts to acquire a client and run a simple query.
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to the PostgreSQL database.');
    const result = await client.query('SELECT NOW() AS current_time');
    console.log(`Database current time: ${result.rows[0].current_time}`);
    client.release();
  } catch (err) {
    console.error('❌ Error connecting to the PostgreSQL database:', err.message);
    // Graceful error handling; not exiting the process allows the server to stay alive 
    // and serve mock data or handle reconnections.
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection,
};
