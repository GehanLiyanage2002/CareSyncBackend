
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
        SELECT id, name, description, location, price, is_available
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
      const { name, price, description, location } = req.body;
      
      if (!name) {
        res.status(400);
        return next(new Error('Please provide name for the service'));
      }

      const query = `
        INSERT INTO services (name, description, location, price, is_available)
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING id, name, description, location, price, is_available
      `;
      const result = await db.query(query, [name, description || null, location || null, Number(price || 0)]);

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
      const { name, price, is_available, description, location } = req.body;

      if (!name || is_available === undefined) {
        res.status(400);
        return next(new Error('Please provide name and availability status'));
      }

      const query = `
        UPDATE services
        SET name = $1, description = $2, location = $3, price = $4, is_available = $5
        WHERE id = $6
        RETURNING id, name, description, location, price, is_available
      `;
      const result = await db.query(query, [name, description || null, location || null, Number(price || 0), is_available, id]);

      if (result.rows.length === 0) {
        res.status(404);
        return next(new Error('Service not found'));
      }

      // Emit socket event for real-time updates
      const io = req.app?.get('io');
      if (io) {
        io.emit('serviceUpdated', { service: result.rows[0] });
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
   * @route   PUT /api/services/:id/image
   * @desc    Upload service image
   * @access  Private (Admin Only)
   */
  static async uploadServiceImage(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        res.status(400);
        return next(new Error('Please upload an image file'));
      }

      const query = `
        UPDATE services
        SET image = $1, image_mimetype = $2
        WHERE id = $3
        RETURNING id
      `;
      
      const result = await db.query(query, [req.file.buffer, req.file.mimetype, id]);
      
      if (result.rows.length === 0) {
        res.status(404);
        return next(new Error('Service not found'));
      }
      
      // Emit socket event for real-time updates
      const io = req.app?.get('io');
      if (io) {
        io.emit('serviceImageUpdated', { serviceId: id });
      }
      
      res.status(200).json({
        success: true,
        message: 'Service image uploaded successfully'
      });
    } catch (error) {
      console.error('Error in uploadServiceImage:', error);
      next(error);
    }
  }

  /**
   * @route   GET /api/services/:id/image
   * @desc    Get service image
   * @access  Public
   */
  static async getServiceImage(req, res, next) {
    try {
      const { id } = req.params;
      const query = `SELECT image, image_mimetype FROM services WHERE id = $1`;
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0 || !result.rows[0].image) {
        return res.status(404).send('Image not found');
      }
      
      res.set('Content-Type', result.rows[0].image_mimetype);
      res.send(result.rows[0].image);
    } catch (error) {
      console.error('Error in getServiceImage:', error);
      res.status(500).send('Server Error');
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

  /**
   * @route   GET /api/services/:id/schedules
   * @desc    Get schedules for a specific service
   * @access  Private
   */
  static async getServiceSchedules(req, res, next) {
    try {
      const { id } = req.params;
      const query = `
        SELECT id, service_id, TO_CHAR(schedule_date, 'YYYY-MM-DD') AS schedule_date,
               TO_CHAR(start_time, 'HH24:MI') AS start_time,
               TO_CHAR(end_time, 'HH24:MI') AS end_time,
               slot_duration_minutes
        FROM service_schedules
        WHERE service_id = $1
        ORDER BY schedule_date ASC, start_time ASC
      `;
      const result = await db.query(query, [id]);
      
      res.status(200).json({
        success: true,
        schedules: result.rows
      });
    } catch (error) {
      console.error('Error fetching service schedules:', error);
      next(error);
    }
  }

  /**
   * @route   POST /api/services/:id/schedules
   * @desc    Add a schedule to a service
   * @access  Private (Admin Only)
   */
  static async addServiceSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const { schedule_date, start_time, end_time, slot_duration_minutes } = req.body;

      if (!schedule_date || !start_time || !end_time || !slot_duration_minutes) {
        res.status(400);
        return next(new Error('Please provide date, start time, end time, and slot duration.'));
      }

      const query = `
        INSERT INTO service_schedules (service_id, schedule_date, start_time, end_time, slot_duration_minutes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, service_id, TO_CHAR(schedule_date, 'YYYY-MM-DD') AS schedule_date,
                  TO_CHAR(start_time, 'HH24:MI') AS start_time,
                  TO_CHAR(end_time, 'HH24:MI') AS end_time,
                  slot_duration_minutes
      `;
      const result = await db.query(query, [id, schedule_date, start_time, end_time, slot_duration_minutes]);

      res.status(201).json({
        success: true,
        message: 'Schedule added successfully',
        schedule: result.rows[0]
      });
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        res.status(400);
        return next(new Error('A schedule for this date already exists.'));
      }
      console.error('Error adding service schedule:', error);
      next(error);
    }
  }

  /**
   * @route   DELETE /api/services/schedules/:scheduleId
   * @desc    Delete a service schedule
   * @access  Private (Admin Only)
   */
  static async deleteServiceSchedule(req, res, next) {
    try {
      const { scheduleId } = req.params;
      const result = await db.query('DELETE FROM service_schedules WHERE id = $1 RETURNING id', [scheduleId]);

      if (result.rows.length === 0) {
        res.status(404);
        return next(new Error('Schedule not found.'));
      }

      res.status(200).json({
        success: true,
        message: 'Schedule deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting service schedule:', error);
      next(error);
    }
  }
}

module.exports = ServiceController;
