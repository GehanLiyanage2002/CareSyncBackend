const db = require('./config/db');

async function checkReports() {
  try {
    const report = await db.query(`SELECT patient_id FROM medical_reports LIMIT 1`);
    if(report.rows.length > 0) {
      const patientId = report.rows[0].patient_id;
      console.log('Report patient_id:', patientId);
      const user = await db.query(`SELECT id, full_name, role FROM users WHERE id = $1`, [patientId]);
      console.log('User associated with report:', user.rows[0]);
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkReports();
