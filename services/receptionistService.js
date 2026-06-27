const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const { decrypt } = require('../utils/cryptoUtils');
const ApiError = require('../utils/ApiError');

class ReceptionistService {
  static async registerWalkInPatient(bodyData, io) {
    const {
      name,
      email,
      phone,
      blood_group,
      emergency_contact_name,
      emergency_contact_number
    } = bodyData;

    if (!name || !phone) {
      throw new ApiError(400, 'Name and phone number are required.');
    }

    // Generate a dummy email if not provided
    const patientEmail = email || `walkin_${Date.now()}@caresync.local`;

    // Check if patient already exists by phone OR email
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE mobile_number = $1 OR (email = $2 AND email NOT LIKE $3)',
      [phone, email || '', 'walkin_%@caresync.local']
    );

    if (existingUser.rows.length > 0) {
      const patientToUpdate = existingUser.rows[0];
      const finalEmail = email || patientToUpdate.email;

      // Update existing patient details
      const updateResult = await pool.query(
        `UPDATE users 
         SET full_name = $1, mobile_number = $2, blood_group = $3, 
             emergency_contact_name = $4, emergency_contact_number = $5, email = $6
         WHERE id = $7
         RETURNING *`,
        [
          name, phone, blood_group || null,
          emergency_contact_name || null, emergency_contact_number || null, finalEmail, patientToUpdate.id
        ]
      );

      const updatedPatient = updateResult.rows[0];
      delete updatedPatient.password_hash;

      // Emit socket event for real-time update
      if (io) {
        io.emit('patientUpdated', updatedPatient);
      }

      return { patient: updatedPatient, isNew: false };
    }

    // Default password for walk-in patients
    const defaultPassword = 'walkin123';
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(defaultPassword, salt);

    // Create the patient user with medical details
    const result = await pool.query(
      `INSERT INTO users (
        full_name, email, password_hash, role, mobile_number, 
        blood_group, emergency_contact_name, emergency_contact_number, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        name, patientEmail, password_hash, 'Patient', phone,
        blood_group || null, emergency_contact_name || null, emergency_contact_number || null, true
      ]
    );

    const newPatient = result.rows[0];

    // Remove sensitive data before sending response
    delete newPatient.password_hash;

    // Emit socket event for real-time update
    if (io) {
      io.emit('patientRegistered', newPatient);
    }

    return { patient: newPatient, isNew: true };
  }

  static async searchPatients(q) {
    if (!q || q.length < 2) {
      throw new ApiError(400, 'Search query must be at least 2 characters long.');
    }

    const searchTerm = `%${q}%`;
    const result = await pool.query(
      `SELECT id, full_name, email, mobile_number, blood_group, emergency_contact_name, emergency_contact_number 
       FROM users 
       WHERE role = 'Patient' 
         AND (full_name ILIKE $1 OR email ILIKE $1 OR mobile_number ILIKE $1)
       LIMIT 10`,
      [searchTerm]
    );

    const decryptedPatients = result.rows.map(user => {
      try {
        return {
          ...user,
          email: user.email ? decrypt(user.email) : null,
          mobile_number: user.mobile_number ? decrypt(user.mobile_number) : null,
          emergency_contact_number: user.emergency_contact_number ? decrypt(user.emergency_contact_number) : null
        };
      } catch (err) {
        return user;
      }
    });

    return decryptedPatients;
  }

  static async getAllPatients() {
    const result = await pool.query(
      `SELECT id, full_name, email, mobile_number, blood_group, emergency_contact_name, emergency_contact_number 
       FROM users 
       WHERE role = 'Patient'`
    );

    const decryptedPatients = result.rows.map(user => {
      try {
        return {
          ...user,
          email: user.email ? decrypt(user.email) : null,
          mobile_number: user.mobile_number ? decrypt(user.mobile_number) : null,
          emergency_contact_number: user.emergency_contact_number ? decrypt(user.emergency_contact_number) : null
        };
      } catch (err) {
        // If decryption fails, return original to avoid crashing the whole list
        return user;
      }
    });

    return decryptedPatients;
  }

  static async getAllQueues() {
    const appointmentsResult = await pool.query(
      `SELECT a.id, a.patient_id, a.patient_name, a.mobile_number, a.appointment_date, 
              a.start_time, a.status, a.token_number, a.checkin_time, a.doctor_id,
              u_patient.full_name as user_name, u_patient.mobile_number as user_phone,
              u_doctor.full_name as doctor_name
       FROM appointments a
       LEFT JOIN users u_patient ON a.patient_id = u_patient.id
       LEFT JOIN users u_doctor ON a.doctor_id = u_doctor.id
       WHERE a.appointment_date = CURRENT_DATE
       ORDER BY a.doctor_id, a.start_time ASC`
    );

    const appointments = appointmentsResult.rows;

    // Group by doctor
    const groupedData = {};

    appointments.forEach(app => {
      const docId = app.doctor_id;
      if (!docId) return;

      if (!groupedData[docId]) {
        groupedData[docId] = {
          doctorId: docId,
          doctorName: app.doctor_name || 'Unknown Doctor',
          activeQueueCount: 0,
          upcomingAppointments: [],
          activeQueue: [],
          pendingAppointments: []
        };
      }

      if (app.status === 'In Progress') {
        groupedData[docId].upcomingAppointments.push(app);
      } else if (app.status === 'IN_QUEUE' || app.status === 'WITH_DOCTOR') {
        groupedData[docId].activeQueue.push(app);
        groupedData[docId].activeQueueCount++;
      } else if (app.status === 'Pending' || app.status === 'pending') {
        groupedData[docId].pendingAppointments.push(app);
      }
    });

    // Sort active queues by token_number
    const result = Object.values(groupedData).map(doc => {
      doc.activeQueue.sort((a, b) => {
        const tokenA = parseInt(a.token_number) || 0;
        const tokenB = parseInt(b.token_number) || 0;
        return tokenA - tokenB;
      });
      return doc;
    });

    return result;
  }

  static async getQueueDashboard(doctorId) {
    // Fetch today's appointments for the doctor
    const appointmentsResult = await pool.query(
      `SELECT a.id, a.patient_id, a.patient_name, a.mobile_number, a.appointment_date, 
              a.start_time, a.status, a.token_number, a.checkin_time, 
              u.full_name as user_name, u.mobile_number as user_phone
       FROM appointments a
       LEFT JOIN users u ON a.patient_id = u.id
       WHERE a.doctor_id = $1 
         AND a.appointment_date = CURRENT_DATE
       ORDER BY a.start_time ASC`,
      [doctorId]
    );

    const appointments = appointmentsResult.rows;

    // Split into upcoming and activeQueue
    const upcoming = appointments.filter(app => app.status === 'In Progress');
    
    const activeQueueRaw = appointments.filter(app => 
      app.status === 'IN_QUEUE' || app.status === 'WITH_DOCTOR'
    );
    
    // Sort activeQueue by token_number ASC
    const activeQueue = activeQueueRaw.sort((a, b) => {
      const tokenA = parseInt(a.token_number) || 0;
      const tokenB = parseInt(b.token_number) || 0;
      return tokenA - tokenB;
    });

    return { upcoming, activeQueue, allAppointments: appointments };
  }

  static async getActiveQueue(doctorId) {
    const appointmentsResult = await pool.query(
      `SELECT a.id, a.patient_id, a.patient_name, a.mobile_number, a.appointment_date, 
              a.start_time, a.status, a.token_number, a.checkin_time, 
              u.full_name as user_name, u.mobile_number as user_phone
       FROM appointments a
       LEFT JOIN users u ON a.patient_id = u.id
       WHERE a.doctor_id = $1 
         AND a.appointment_date = CURRENT_DATE
         AND (a.status = 'IN_QUEUE' OR a.status = 'WITH_DOCTOR')
       ORDER BY CAST(a.token_number AS INTEGER) ASC`,
      [doctorId]
    );

    return appointmentsResult.rows;
  }

  static async checkInPatient(appointmentId, io) {
    // Find the appointment
    const appointmentResult = await pool.query(
      'SELECT id, doctor_id, appointment_date, status FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (appointmentResult.rows.length === 0) {
      throw new ApiError(404, 'Appointment not found.');
    }

    const appointment = appointmentResult.rows[0];

    if (appointment.status === 'IN_QUEUE' || appointment.status === 'WITH_DOCTOR') {
      throw new ApiError(400, 'Patient is already in the queue.');
    }

    // Generate token number: count appointments today for this doctor with token_number NOT NULL
    const countResult = await pool.query(
      `SELECT COUNT(*) as token_count 
       FROM appointments 
       WHERE doctor_id = $1 
         AND appointment_date = CURRENT_DATE 
         AND token_number IS NOT NULL`,
      [appointment.doctor_id]
    );

    const nextTokenNumber = parseInt(countResult.rows[0].token_count) + 1;

    // Update the appointment
    await pool.query(
      `UPDATE appointments 
       SET status = 'IN_QUEUE', 
           token_number = $1, 
           checkin_time = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [nextTokenNumber.toString(), appointmentId]
    );

    // Emit socket event for real-time updates
    if (io) {
      io.emit('appointmentStatusChanged', {
        appointment_id: appointmentId,
        doctor_id: appointment.doctor_id,
        status: 'IN_QUEUE'
      });
    }

    return { token_number: nextTokenNumber };
  }
}

module.exports = ReceptionistService;
