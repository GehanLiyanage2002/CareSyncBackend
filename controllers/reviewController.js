const db = require('../config/db');

class ReviewController {
  /**
   * @route   POST /api/reviews
   * @desc    Patient submits a review for a completed appointment
   * @access  Private (Patient only)
   */
  static async createReview(req, res) {
    try {
      const patientId = req.user.id;
      const { appointment_id, doctor_id, rating, comment } = req.body;

      if (!appointment_id || !doctor_id || !rating) {
        return res.status(400).json({ success: false, message: 'appointment_id, doctor_id, and rating are required' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      }

      // Verify this appointment belongs to this patient and is completed
      const apptCheck = await db.query(
        `SELECT id, status, patient_id FROM appointments WHERE id = $1`,
        [appointment_id]
      );

      if (apptCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      const appt = apptCheck.rows[0];
      if (appt.patient_id !== patientId) {
        return res.status(403).json({ success: false, message: 'You can only review your own appointments' });
      }

      if (appt.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'You can only review completed appointments' });
      }

      // Check if review already exists
      const existing = await db.query(
        `SELECT id FROM reviews WHERE appointment_id = $1`,
        [appointment_id]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'You have already reviewed this appointment' });
      }

      // Get patient name
      const patientRes = await db.query(`SELECT full_name FROM users WHERE id = $1`, [patientId]);
      const patientName = patientRes.rows[0]?.full_name || 'Anonymous';

      const result = await db.query(
        `INSERT INTO reviews (appointment_id, patient_id, doctor_id, rating, comment, patient_name)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [appointment_id, patientId, doctor_id, rating, comment || '', patientName]
      );

      res.status(201).json({ success: true, review: result.rows[0] });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  /**
   * @route   GET /api/reviews/:doctorId
   * @desc    Get all reviews for a specific doctor
   * @access  Public
   */
  static async getDoctorReviews(req, res) {
    try {
      const { doctorId } = req.params;

      const result = await db.query(
        `SELECT r.id, r.rating, r.comment, r.patient_name, r.created_at,
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

      res.status(200).json({
        success: true,
        reviews: result.rows,
        average_rating: parseFloat(avgResult.rows[0].average_rating) || 0,
        total_reviews: parseInt(avgResult.rows[0].total_reviews) || 0
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  /**
   * @route   GET /api/reviews/my-review/:appointmentId
   * @desc    Check if patient already reviewed a specific appointment
   * @access  Private (Patient)
   */
  static async getMyReview(req, res) {
    try {
      const patientId = req.user.id;
      const { appointmentId } = req.params;

      const result = await db.query(
        `SELECT * FROM reviews WHERE appointment_id = $1 AND patient_id = $2`,
        [appointmentId, patientId]
      );

      res.status(200).json({ success: true, review: result.rows[0] || null });
    } catch (error) {
      console.error('Error fetching review:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

module.exports = ReviewController;
