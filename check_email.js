const db = require('./config/db');

async function checkGehanEmail() {
  try {
    const users = await db.query(`SELECT id, full_name, role, email FROM users WHERE email = 'gahenliyanage@gmail.com'`);
    console.log('Users with email:');
    console.log(users.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkGehanEmail();
