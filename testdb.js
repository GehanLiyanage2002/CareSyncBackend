const { Pool } = require('pg'); 
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); 
pool.query("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_rescheduled BOOLEAN DEFAULT FALSE;").then(() => { 
  console.log('Done'); 
  pool.end(); 
}).catch(e => { console.error(e); pool.end(); });
