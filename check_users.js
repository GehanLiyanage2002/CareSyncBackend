const db = require('./config/db');

async function checkUsers() {
  try {
    const users = await db.query(`SELECT id, full_name, role FROM users WHERE full_name ILIKE '%Pubudu%'`);
    console.log('Users with name Pubudu:');
    console.log(users.rows);

    const appointments = await db.query(`SELECT id, patient_id, doctor_id, doctor_name FROM appointments`);
    console.log('\nAppointments:');
    console.log(appointments.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkUsers();
