const { Pool } = require('pg'); 
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); 

pool.query("SELECT * FROM appointments").then(result => {
  let appointments = result.rows;
  const filter = 'today';
  if (filter === 'today') {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayLocalStr = `${yyyy}-${mm}-${dd}`;

    console.log(`[FILTER] todayLocalStr: ${todayLocalStr}`);

    appointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      const aptYyyy = aptDate.getFullYear();
      const aptMm = String(aptDate.getMonth() + 1).padStart(2, '0');
      const aptDd = String(aptDate.getDate()).padStart(2, '0');
      const aptLocalStr = `${aptYyyy}-${aptMm}-${aptDd}`;
      
      console.log(`[FILTER] apt.id: ${apt.id}, aptDate in DB: ${apt.appointment_date}, aptLocalStr: ${aptLocalStr}, match: ${aptLocalStr === todayLocalStr}`);
      return aptLocalStr === todayLocalStr;
    });
  }
  console.log('Filtered Count:', appointments.length);
  pool.end();
}).catch(console.error);
