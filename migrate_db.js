const db = require('./config/db');
const PatientModel = require('./models/patientModel');

async function migrate() {
  await PatientModel.setupPatientProfilesTable();
  console.log("Migrating patient data...");
  try {
    await db.query(`
      INSERT INTO patient_profiles (patient_id, date_of_birth, address, blood_group, allergies, chronic_conditions, emergency_contact_name, emergency_contact_number)
      SELECT id, date_of_birth, address, blood_group, allergies, chronic_conditions, emergency_contact_name, emergency_contact_number
      FROM users WHERE role = 'Patient'
      ON CONFLICT (patient_id) DO NOTHING;
    `);
    console.log("Data migrated successfully.");
    console.log("Dropping old columns...");
    await db.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS date_of_birth,
      DROP COLUMN IF EXISTS address,
      DROP COLUMN IF EXISTS blood_group,
      DROP COLUMN IF EXISTS allergies,
      DROP COLUMN IF EXISTS chronic_conditions,
      DROP COLUMN IF EXISTS emergency_contact_name,
      DROP COLUMN IF EXISTS emergency_contact_number;
    `);
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
  }
  process.exit(0);
}
migrate();
