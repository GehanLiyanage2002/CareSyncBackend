const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT doctor_id FROM doctor_profiles WHERE doctor_id = $1', ['dfc9e2f4-2033-40cc-9fda-f422b96cbab6'])
  .then(res => { console.log('Rows:', res.rows.length); pool.end(); })
  .catch(err => { console.error(err); pool.end(); });
