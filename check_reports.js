const db = require('./config/db');

async function checkReports() {
  try {
    const user = await db.query(`SELECT id FROM users WHERE full_name ILIKE '%Pubudu%'`);
    if (user.rows.length > 0) {
      const patientId = user.rows[0].id;
      const reports = await db.query(`SELECT * FROM medical_reports WHERE patient_id = $1`, [patientId]);
      console.log('Reports for user:', reports.rows.length);
      console.log(reports.rows);
    } else {
      console.log('User not found');
    }
    
    // Also let's check all medical reports just in case
    const allReports = await db.query(`SELECT * FROM medical_reports`);
    console.log('Total medical reports in db:', allReports.rows.length);
    if(allReports.rows.length > 0) {
      console.log('First report title:', allReports.rows[0].title);
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkReports();
