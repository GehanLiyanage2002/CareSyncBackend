const db = require('./config/db');
db.query("SELECT id FROM users WHERE email='gahenliyanage@gmail.com'").then(res => { console.log(res.rows); process.exit(0); });
