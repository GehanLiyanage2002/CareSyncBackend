const db = require('./config/db');
async function run() {
  try {
    const query = `
      SELECT u.id, u.full_name, u.email, u.mobile_number, u.created_at, 
             dp.specialization, dp.experience, dp.is_approved, dp.consultation_fee, dp.is_available,
             CASE WHEN dp.id_card_front IS NOT NULL THEN true ELSE false END as has_id_card_front,
             CASE WHEN dp.id_card_rear IS NOT NULL THEN true ELSE false END as has_id_card_rear,
             (SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE doctor_id = u.id) as total_patients,
             (SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM reviews WHERE doctor_id = u.id) as average_rating
      FROM users u
      LEFT JOIN doctor_profiles dp ON u.id = dp.doctor_id
      WHERE u.role = 'Doctor'
      ORDER BY u.created_at DESC
    `;
    const res = await db.query(query);
    console.log("Success:", res.rows.length);
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit();
}
run();
