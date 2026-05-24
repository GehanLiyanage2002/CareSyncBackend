const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'password';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5432';
const database = process.env.DB_NAME || 'caresync';

// Construct standard postgres connection string
const dbUrl = `postgres://${user}:${password}@${host}:${port}/${database}`;

// Get command line arguments (e.g. "up", "create initial")
const args = process.argv.slice(2).join(' ');

console.log(`Running migration command: node-pg-migrate ${args}`);

try {
  execSync(`npx node-pg-migrate -d DATABASE_URL ${args}`, {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Migration failed.');
  process.exit(1);
}
