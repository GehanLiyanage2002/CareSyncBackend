const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const { decrypt } = require('../utils/cryptoUtils');

class ReviewService {
  static async createReview(patientId, bodyData, io) {
    const { appointment_id, doctor_id, rating, comment } = bodyData;

    if (!appointment_id || !doctor_id || !rating) {
      throw new ApiError(400, 'appointment_id, doctor_id, and rating are required');
    }

    if (rating < 1 || rating > 5) {
      throw new ApiError(400, 'Rating must be between 1 and 5');
    }

    // Verify this appointment belongs to this patient and is completed
    const apptCheck = await db.query(
      `SELECT id, status, patient_id FROM appointments WHERE id = $1`,
      [appointment_id]
    );

    if (apptCheck.rows.length === 0) {
      throw new ApiError(404, 'Appointment not found');
    }

    const appt = apptCheck.rows[0];
    if (appt.patient_id !== patientId) {
      throw new ApiError(403, 'You can only review your own appointments');
    }

    if (appt.status !== 'Completed') {
      throw new ApiError(400, 'You can only review completed appointments');
    }

    // Check if review already exists
    const existing = await db.query(
      `SELECT id FROM reviews WHERE appointment_id = $1`,
      [appointment_id]
    );
    if (existing.rows.length > 0) {
      throw new ApiError(400, 'You have already reviewed this appointment');
    }

    // Get patient name
    const patientRes = await db.query(`SELECT full_name FROM users WHERE id = $1`, [patientId]);
    const patientName = patientRes.rows[0]?.full_name || 'Anonymous';

    const result = await db.query(
      `INSERT INTO reviews (appointment_id, patient_id, doctor_id, rating, comment, patient_name)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [appointment_id, patientId, doctor_id, rating, comment || '', patientName]
    );

    // Emit socket event for real-time review update on doctor profile
    if (io) {
      io.emit('reviewAdded', { doctor_id, review: result.rows[0] });
    }

    return { review: result.rows[0] };
  }

  static async getDoctorReviews(doctorId) {
    const result = await db.query(
      `SELECT r.id, r.rating, r.comment, r.patient_name, r.patient_id, r.created_at,
              a.appointment_date
       FROM reviews r
       LEFT JOIN appointments a ON r.appointment_id = a.id
       WHERE r.doctor_id = $1
       ORDER BY r.created_at DESC`,
      [doctorId]
    );

    // Compute average rating
    const avgResult = await db.query(
      `SELECT ROUND(AVG(rating)::numeric, 1) as average_rating, COUNT(*) as total_reviews
       FROM reviews WHERE doctor_id = $1`,
      [doctorId]
    );

    return {
      reviews: result.rows,
      average_rating: parseFloat(avgResult.rows[0].average_rating) || 0,
      total_reviews: parseInt(avgResult.rows[0].total_reviews) || 0
    };
  }

  static async getRecentPublicReviews() {
    const result = await db.query(
      `SELECT r.id, r.rating, r.comment, r.patient_name, r.patient_id, r.created_at,
              r.doctor_id, u.full_name AS doctor_name
       FROM reviews r
       JOIN users u ON r.doctor_id = u.id
       WHERE r.comment IS NOT NULL AND r.comment != ''
       ORDER BY r.rating DESC, r.created_at DESC
       LIMIT 9`
    );

    return { reviews: result.rows };
  }

  static async getMyReview(patientId, appointmentId) {
    const result = await db.query(
      `SELECT * FROM reviews WHERE appointment_id = $1 AND patient_id = $2`,
      [appointmentId, patientId]
    );

    return { review: result.rows[0] || null };
  }

  static async getPatientReviews(patientId) {
    const result = await db.query(
      `SELECT r.id, r.rating, r.comment, r.is_read, r.created_at,
              r.doctor_id, u.full_name AS doctor_name,
              dp.specialization AS doctor_specialization,
              a.appointment_date
       FROM reviews r
       JOIN users u ON r.doctor_id = u.id
       LEFT JOIN doctor_profiles dp ON dp.doctor_id = r.doctor_id
       LEFT JOIN appointments a ON r.appointment_id = a.id
       WHERE r.patient_id = $1
       ORDER BY r.created_at DESC`,
      [patientId]
    );

    const reviews = result.rows.map(row => ({
      ...row,
      doctor_specialization: row.doctor_specialization ? decrypt(row.doctor_specialization) : null
    }));

    return { reviews };
  }

  static async markReviewsRead(doctorId, io) {
    await db.query(
      `UPDATE reviews SET is_read = TRUE WHERE doctor_id = $1 AND is_read = FALSE`,
      [doctorId]
    );

    // Emit socket event so patient's view updates in real-time
    if (io) {
      io.emit('reviewsRead', { doctor_id: doctorId });
    }

    return {};
  }
}

module.exports = ReviewService;
