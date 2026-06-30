const db = require('./config/db');

async function checkUsers() {
  try {
    const users = await db.query(`SELECT id, full_name, role FROM users WHERE full_name ILIKE '%Gehan%'`);
    console.log('Users with name Gehan:');
    console.log(users.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkUsers();
