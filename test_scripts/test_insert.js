const db = require('./config/db');

async function testInsert() {
  try {
    const query = `
      INSERT INTO service_bookings (patient_id, service_id, appointment_date, appointment_time, amount_paid, status)
      VALUES (null, 1, '2026-05-31', '10:00', 5000, 'Confirmed')
      RETURNING id
    `;
    const res = await db.query(query);
    console.log("SUCCESS:", res.rows);
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    process.exit(0);
  }
}

testInsert();
