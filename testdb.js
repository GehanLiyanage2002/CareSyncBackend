const { Pool } = require('pg'); 
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); 
pool.query(`
  SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.start_time, a.status, a.patient_name,
         u.full_name as doctor_name
  FROM appointments a
  JOIN users u ON a.doctor_id = u.id
  WHERE a.status = 'Pending'
  ORDER BY a.appointment_date DESC
  LIMIT 5
`).then(res => { 
  console.log(JSON.stringify(res.rows, null, 2)); 
  pool.end(); 
}).catch(e => { console.error(e); pool.end(); });
