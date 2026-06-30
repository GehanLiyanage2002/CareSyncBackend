const db = require('./config/db');
db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'medical_reports'")
  .then(r => console.log(r.rows))
  .catch(console.error)
  .finally(() => process.exit());
