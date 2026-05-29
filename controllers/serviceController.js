<<<<<<< HEAD
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
=======
const db = require('../config/db');

class ServiceController {
  /**
   * @route   GET /api/services
   * @desc    Get all medical services
   * @access  Private
   */
  static async getAllServices(req, res, next) {
    try {
      const query = `
        SELECT id, name, price, is_available
        FROM services
        ORDER BY name ASC
      `;
      const result = await db.query(query);
      
      res.status(200).json({
        success: true,
        services: result.rows
      });
    } catch (error) {
      console.error('Error in getAllServices:', error);
      next(error);
    }
  }

  /**
   * @route   POST /api/services
   * @desc    Create a new medical service
   * @access  Private (Admin Only)
   */
  static async createService(req, res, next) {
    try {
      const { name, price } = req.body;
      
      if (!name || price === undefined) {
        res.status(400);
        return next(new Error('Please provide name and price for the service'));
      }

      const query = `
        INSERT INTO services (name, price, is_available)
        VALUES ($1, $2, TRUE)
        RETURNING id, name, price, is_available
      `;
      const result = await db.query(query, [name, Number(price)]);

      // Emit socket event for real-time updates
      const io = req.app?.get('io');
      if (io) {
        io.emit('serviceAdded', { service: result.rows[0] });
      }

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        service: result.rows[0]
      });
    } catch (error) {
      console.error('Error in createService:', error);
      next(error);
    }
  }

  /**
   * @route   PUT /api/services/:id
   * @desc    Update service details or availability
   * @access  Private (Admin Only)
   */
  static async updateService(req, res, next) {
    try {
      const { id } = req.params;
      const { name, price, is_available } = req.body;

      if (!name || price === undefined || is_available === undefined) {
        res.status(400);
        return next(new Error('Please provide name, price, and availability status'));
      }

      const query = `
        UPDATE services
        SET name = $1, price = $2, is_available = $3
        WHERE id = $4
        RETURNING id, name, price, is_available
      `;
      const result = await db.query(query, [name, Number(price), is_available, id]);

      if (result.rows.length === 0) {
        res.status(404);
        return next(new Error('Service not found'));
      }

      res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        service: result.rows[0]
      });
    } catch (error) {
      console.error('Error in updateService:', error);
      next(error);
    }
  }

  /**
   * @route   POST /api/services/book
   * @desc    Book a medical service
   * @access  Private (Patient Only)
   */
  static async bookService(req, res, next) {
    try {
      const patientId = req.user.id;
      const { service_id, date, time, amount_paid } = req.body;

      if (!service_id || !date || !time || !amount_paid) {
        res.status(400);
        return next(new Error('Please provide service_id, date, time, and amount_paid'));
      }

      // Check if service is available
      const checkService = await db.query(
        'SELECT is_available, name FROM services WHERE id = $1',
        [service_id]
      );
      
      if (checkService.rows.length === 0) {
        res.status(404);
        return next(new Error('Service not found'));
      }

      if (!checkService.rows[0].is_available) {
        res.status(400);
        return next(new Error('This service is currently unavailable'));
      }

      const query = `
        INSERT INTO service_bookings (patient_id, service_id, booking_date, booking_time, amount_paid, status)
        VALUES ($1, $2, $3, $4, $5, 'Confirmed')
        RETURNING id
      `;
      const result = await db.query(query, [
        patientId,
        service_id,
        date,
        time,
        Number(amount_paid)
      ]);

      res.status(201).json({
        success: true,
        message: 'Service booked successfully',
        booking: {
          id: result.rows[0].id
        }
      });
    } catch (error) {
      console.error('Error in bookService:', error);
      next(error);
    }
  }

  /**
   * @route   GET /api/services/bookings
   * @desc    Get bookings history for patient or all bookings for Admin
   * @access  Private
   */
  static async getMyBookings(req, res, next) {
    try {
      let query;
      let params = [];

      if (req.user.role === 'Admin') {
        query = `
          SELECT sb.id, s.name AS "serviceName", 
                 TO_CHAR(sb.booking_date, 'YYYY-MM-DD') AS date, 
                 TO_CHAR(sb.booking_time, 'HH24:MI') AS time, 
                 sb.amount_paid AS price,
                 u.full_name AS "patientName"
          FROM service_bookings sb
          JOIN services s ON sb.service_id = s.id
          JOIN users u ON sb.patient_id = u.id
          ORDER BY sb.booking_date DESC, sb.booking_time DESC
        `;
      } else {
        query = `
          SELECT sb.id, s.name AS "serviceName", 
                 TO_CHAR(sb.booking_date, 'YYYY-MM-DD') AS date, 
                 TO_CHAR(sb.booking_time, 'HH24:MI') AS time, 
                 sb.amount_paid AS price
          FROM service_bookings sb
          JOIN services s ON sb.service_id = s.id
          WHERE sb.patient_id = $1
          ORDER BY sb.booking_date DESC, sb.booking_time DESC
        `;
        params = [req.user.id];
      }

      const result = await db.query(query, params);

      res.status(200).json({
        success: true,
        bookings: result.rows
      });
    } catch (error) {
      console.error('Error in getMyBookings:', error);
      next(error);
    }
  }
}

module.exports = ServiceController;
>>>>>>> dev
