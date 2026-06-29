require('dotenv').config();
const db = require('./config/db');
db.query("SELECT email, mobile_number FROM users WHERE email='pubudugunawarsana@gmail.com'")
  .then(r => console.log(r.rows))
  .catch(console.error)
  .finally(() => process.exit());
