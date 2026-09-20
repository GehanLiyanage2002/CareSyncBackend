const db = require('../config/db');
const ApiError = require('../utils/ApiError');

class ServiceService {
  static async getAllServices() {
    const query = `
      SELECT id, name, description, location, price, is_available, 
      CASE WHEN image IS NOT NULL THEN true ELSE false END as has_image
      FROM services
      ORDER BY name ASC
    `;
    const result = await db.query(query);
    return { services: result.rows };
  }

  static async createService(bodyData, io) {
    const { name, price, description, location } = bodyData;
    
    if (!name) {
      throw new ApiError(400, 'Please provide name for the service');
    }

    const query = `
      INSERT INTO services (name, description, location, price, is_available)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, name, description, location, price, is_available
    `;
    const result = await db.query(query, [name, description || null, location || null, Number(price || 0)]);

    if (io) {
      io.emit('serviceAdded', { service: result.rows[0] });
    }

    return { service: result.rows[0] };
  }

  static async updateService(id, bodyData, io) {
    const { name, price, is_available, description, location } = bodyData;

    if (!name || is_available === undefined) {
      throw new ApiError(400, 'Please provide name and availability status');
    }

    const query = `
      UPDATE services
      SET name = $1, description = $2, location = $3, price = $4, is_available = $5
      WHERE id = $6
      RETURNING id, name, description, location, price, is_available
    `;
    const result = await db.query(query, [name, description || null, location || null, Number(price || 0), is_available, id]);

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Service not found');
    }

    if (io) {
      io.emit('serviceUpdated', { service: result.rows[0] });
    }

    return { service: result.rows[0] };
  }

  static async uploadServiceImage(id, fileData, io) {
    if (!fileData) {
      throw new ApiError(400, 'Please upload an image file');
    }

    const query = `
      UPDATE services
      SET image = $1, image_mimetype = $2
      WHERE id = $3
      RETURNING id
    `;
    
    const result = await db.query(query, [fileData.buffer, fileData.mimetype, id]);
    
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Service not found');
    }
    
    if (io) {
      io.emit('serviceImageUpdated', { serviceId: id });
    }
    
    return {};
  }

  static async getServiceImage(id) {
    const query = `SELECT image, image_mimetype FROM services WHERE id = $1`;
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0 || !result.rows[0].image) {
      throw new ApiError(404, 'Image not found');
    }
    
    return result.rows[0];
  }

  static generateAvailableDates(schedules) {
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) return [];

    const dayNameToIndex = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const datesMap = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Specific date schedules
    schedules.forEach(sch => {
      if (sch.schedule_date) {
        const parts = sch.schedule_date.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          if (d >= today) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            datesMap.set(dateKey, {
              ...sch,
              schedule_date: dateKey,
              dayName: daysOfWeek[d.getDay()],
              dayNum: d.getDate(),
              month: months[d.getMonth()],
              year: d.getFullYear(),
              formattedDate: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
              timestamp: d.getTime()
            });
          }
        }
      }
    });

    // 2. Weekday recurring schedules (generate next 28 days)
    const weekdaySchedules = schedules.filter(sch => sch.day_of_week && dayNameToIndex[sch.day_of_week.toLowerCase()] !== undefined);
    if (weekdaySchedules.length > 0) {
      for (let i = 0; i < 28; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const targetDayIndex = targetDate.getDay();

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const day = targetDate.getDate();
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const matchingSchedule = weekdaySchedules.find(
          sch => dayNameToIndex[sch.day_of_week.toLowerCase()] === targetDayIndex
        );

        if (matchingSchedule && !datesMap.has(dateKey)) {
          datesMap.set(dateKey, {
            ...matchingSchedule,
            schedule_date: dateKey,
            dayName: daysOfWeek[targetDayIndex],
            dayNum: day,
            month: months[month],
            year: year,
            formattedDate: `${day} ${months[month]} ${year}`,
            timestamp: targetDate.getTime()
          });
        }
      }
    }

    return Array.from(datesMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  static async getBookedSlots(serviceId, date) {
    if (!serviceId || !date) {
      return { booked_slots: [] };
    }
    const query = `
      SELECT TO_CHAR(appointment_time, 'HH24:MI') as time 
      FROM service_bookings 
      WHERE service_id = $1 AND appointment_date = $2 AND status != 'Cancelled'
    `;
    const result = await db.query(query, [serviceId, date]);
    return { booked_slots: result.rows.map(r => r.time) };
  }

  static async bookService(userRole, userId, bodyData, io) {
    let patientId;
    if (userRole === 'Receptionist') {
      patientId = bodyData.patient_id;
      if (!patientId) {
        throw new ApiError(400, 'patient_id is required for Receptionist booking');
      }
    } else {
      patientId = userId;
    }
    
    const { service_id, date, time, amount_paid } = bodyData;

    if (!service_id || !date || !time || amount_paid === undefined || amount_paid === null || amount_paid === '') {
      throw new ApiError(400, 'Please provide service_id, date, time, and amount_paid');
    }

    const parsedServiceId = parseInt(service_id, 10);
    if (isNaN(parsedServiceId)) {
      throw new ApiError(400, 'Invalid service ID');
    }

    const checkService = await db.query(
      'SELECT is_available, name, price FROM services WHERE id = $1',
      [parsedServiceId]
    );
    
    if (checkService.rows.length === 0) {
      throw new ApiError(404, 'Service not found');
    }

    if (!checkService.rows[0].is_available) {
      throw new ApiError(400, 'This service is currently unavailable');
    }

    // Check if slot is already booked
    const existingBooking = await db.query(
      `SELECT id FROM service_bookings 
       WHERE service_id = $1 
         AND appointment_date = $2 
         AND appointment_time = $3 
         AND status != 'Cancelled'`,
      [parsedServiceId, date, time]
    );

    if (existingBooking.rows.length > 0) {
      throw new ApiError(400, 'This time slot is already booked. Please choose another slot.');
    }

    const query = `
      INSERT INTO service_bookings (patient_id, service_id, appointment_date, appointment_time, amount_paid, status)
      VALUES ($1, $2, $3, $4, $5, 'In Progress')
      RETURNING id, patient_id, service_id, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date, TO_CHAR(appointment_time, 'HH24:MI') AS appointment_time, amount_paid, status
    `;
    const result = await db.query(query, [
      patientId,
      parsedServiceId,
      date,
      time,
      Number(amount_paid)
    ]);

    const booking = result.rows[0];

    // Real-time notifications and socket broadcast
    if (patientId) {
      try {
        const NotificationService = require('./notificationService');
        await NotificationService.sendNotification(
          io,
          patientId,
          'Medical Service Booked',
          `Your booking for ${checkService.rows[0].name} on ${date} at ${time} has been confirmed.`,
          'success'
        );
      } catch (notifErr) {
        console.error('Failed to send service booking notification:', notifErr.message);
      }
    }

    if (io) {
      io.emit('serviceBooked', {
        id: booking.id,
        service_id: parsedServiceId,
        service_name: checkService.rows[0].name,
        patient_id: patientId,
        date,
        time
      });
    }

    return { booking };
  }

  static async getMyBookings(userRole, userId) {
    let query;
    let params = [];

    if (userRole === 'Admin' || userRole === 'Receptionist') {
      query = `
        SELECT sb.id, s.name AS "serviceName", 
               TO_CHAR(sb.appointment_date, 'YYYY-MM-DD') AS date, 
               TO_CHAR(sb.appointment_time, 'HH24:MI') AS time, 
               sb.amount_paid AS price,
               sb.status,
               COALESCE(u.full_name, 'Walk-in Patient') AS "patientName",
               u.mobile_number AS "patientPhone"
        FROM service_bookings sb
        JOIN services s ON sb.service_id = s.id
        LEFT JOIN users u ON sb.patient_id = u.id
        ORDER BY sb.appointment_date DESC, sb.appointment_time DESC
      `;
    } else {
      query = `
        SELECT sb.id, s.name AS "serviceName", 
               TO_CHAR(sb.appointment_date, 'YYYY-MM-DD') AS date, 
               TO_CHAR(sb.appointment_time, 'HH24:MI') AS time, 
               sb.amount_paid AS price,
               sb.status
        FROM service_bookings sb
        JOIN services s ON sb.service_id = s.id
        WHERE sb.patient_id = $1
        ORDER BY sb.appointment_date DESC, sb.appointment_time DESC
      `;
      params = [userId];
    }

    const result = await db.query(query, params);
    return { bookings: result.rows };
  }

  static async getServiceSchedules(id) {
    const query = `
      SELECT id, service_id, TO_CHAR(schedule_date, 'YYYY-MM-DD') AS schedule_date,
             day_of_week,
             TO_CHAR(start_time, 'HH24:MI') AS start_time,
             TO_CHAR(end_time, 'HH24:MI') AS end_time,
             COALESCE(slot_duration_minutes, 30) AS slot_duration_minutes
      FROM service_schedules
      WHERE service_id = $1
      ORDER BY schedule_date ASC, day_of_week ASC, start_time ASC
    `;
    const result = await db.query(query, [id]);
    const schedules = result.rows;
    const available_dates = ServiceService.generateAvailableDates(schedules);

    return { schedules, available_dates };
  }

  static async addServiceSchedule(id, bodyData) {
    const { schedule_date, day_of_week, start_time, end_time } = bodyData;

    if (!id || id === 'undefined' || isNaN(parseInt(id))) {
      throw new ApiError(400, 'Invalid service ID');
    }

    if (!start_time || !end_time) {
      throw new ApiError(400, 'Please provide start time and end time.');
    }
    
    if (!schedule_date && !day_of_week) {
      throw new ApiError(400, 'Please provide either a specific date or a day of the week.');
    }

    try {
      const query = `
        INSERT INTO service_schedules (service_id, schedule_date, day_of_week, start_time, end_time)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, service_id, TO_CHAR(schedule_date, 'YYYY-MM-DD') AS schedule_date,
                  day_of_week,
                  TO_CHAR(start_time, 'HH24:MI') AS start_time,
                  TO_CHAR(end_time, 'HH24:MI') AS end_time
      `;
      const result = await db.query(query, [id, schedule_date || null, day_of_week || null, start_time, end_time]);
      return { schedule: result.rows[0] };
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new ApiError(400, 'A schedule for this date already exists.');
      }
      throw error;
    }
  }

  static async deleteServiceSchedule(scheduleId) {
    const result = await db.query('DELETE FROM service_schedules WHERE id = $1 RETURNING id', [scheduleId]);

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Schedule not found.');
    }

    return {};
  }

  static async deleteService(id, io) {
    const checkResult = await db.query('SELECT id FROM services WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      throw new ApiError(404, 'Service not found');
    }

    await db.query('BEGIN');
    try {
      await db.query('DELETE FROM service_bookings WHERE service_id = $1', [id]);
      await db.query('DELETE FROM services WHERE id = $1', [id]);
      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    if (io) {
      io.emit('serviceDeleted', { serviceId: id });
    }

    return {};
  }
}

module.exports = ServiceService;
