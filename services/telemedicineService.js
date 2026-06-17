const { CommunicationIdentityClient } = require('@azure/communication-identity');
const db = require('../config/db');
const ApiError = require('../utils/ApiError');

class TelemedicineService {
  static async getToken(userId, appointmentId) {
    if (!appointmentId) {
      throw new ApiError(400, 'Appointment ID required');
    }

    const result = await db.query('SELECT * FROM appointments WHERE id = $1', [appointmentId]);
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Appointment not found');
    }

    if (!result.rows[0].is_telemedicine) {
      throw new ApiError(400, 'Not a telemedicine appointment');
    }

    const appt = result.rows[0];
    if (userId !== appt.patient_id && userId !== appt.doctor_id) {
      throw new ApiError(403, 'Unauthorized for this meeting');
    }

    const connectionString = process.env.ACS_CONNECTION_STRING;
    if (!connectionString) {
      throw new ApiError(500, 'Azure connection string not configured');
    }

    const identityClient = new CommunicationIdentityClient(connectionString);
    const userToken = await identityClient.createUserAndToken(["voip"]);

    return {
      token: userToken.token,
      user: userToken.user,
      groupId: appointmentId
    };
  }

  static async endCall(userRole, appointmentId, io) {
    if (userRole !== 'Doctor') {
       throw new ApiError(403, 'Only doctor can end call');
    }
    
    const query = `UPDATE appointments SET status = 'Completed' WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [appointmentId]);
    
    if (io) {
      io.emit('callEnded', { appointmentId });
    }

    return { appointment: result.rows[0] };
  }
}

module.exports = TelemedicineService;
