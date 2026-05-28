const { pool } = require('../config/db');

// @desc    Get all medical services
// @route   GET /api/services
// @access  Public or Protected
exports.getServices = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM medical_services ORDER BY id ASC');
    res.status(200).json({ success: true, services: result.rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a medical service
// @route   POST /api/services
// @access  Admin
exports.addService = async (req, res, next) => {
  try {
    const { name, price } = req.body;
    const result = await pool.query(
      'INSERT INTO medical_services (name, price) VALUES ($1, $2) RETURNING *',
      [name, price]
    );
    res.status(201).json({ success: true, service: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a medical service
// @route   PUT /api/services/:id
// @access  Admin
exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, is_available } = req.body;
    
    const result = await pool.query(
      'UPDATE medical_services SET name = $1, price = $2, is_available = $3 WHERE id = $4 RETURNING *',
      [name, price, is_available, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.status(200).json({ success: true, service: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Book a medical service
// @route   POST /api/services/book
// @access  Patient
exports.bookService = async (req, res, next) => {
  try {
    const { service_id, date, time, amount_paid } = req.body;
    const patient_id = req.user.id; // from auth middleware

    const result = await pool.query(
      'INSERT INTO service_bookings (patient_id, service_id, appointment_date, appointment_time, amount_paid) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [patient_id, service_id, date, time, amount_paid]
    );
    
    res.status(201).json({ success: true, booking: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient bookings
// @route   GET /api/services/bookings
// @access  Patient
exports.getPatientBookings = async (req, res, next) => {
  try {
    const patient_id = req.user.id;
    
    const result = await pool.query(`
      SELECT b.id, b.appointment_date as date, b.appointment_time as time, b.amount_paid as price, b.status, s.name as "serviceName"
      FROM service_bookings b
      JOIN medical_services s ON b.service_id = s.id
      WHERE b.patient_id = $1
      ORDER BY b.created_at DESC
    `, [patient_id]);
    
    res.status(200).json({ success: true, bookings: result.rows });
  } catch (error) {
    next(error);
  }
};
