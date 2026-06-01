const { Pool } = require('pg'); 
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); 
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments' ORDER BY ordinal_position").then(res => { 
  console.log(res.rows); 
  pool.end(); 
}).catch(e => { console.error(e); pool.end(); });
