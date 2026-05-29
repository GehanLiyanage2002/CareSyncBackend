const { CommunicationIdentityClient } = require('@azure/communication-identity');
const db = require('../config/db');

class TelemedicineController {
  static async getToken(req, res, next) {
    try {
      const { appointmentId } = req.body;
      if (!appointmentId) {
        return res.status(400).json({ success: false, message: 'Appointment ID required' });
      }

      const result = await db.query('SELECT * FROM appointments WHERE id = $1', [appointmentId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      if (!result.rows[0].is_telemedicine) {
        return res.status(400).json({ success: false, message: 'Not a telemedicine appointment' });
      }

      const appt = result.rows[0];
      if (req.user.id !== appt.patient_id && req.user.id !== appt.doctor_id) {
        return res.status(403).json({ success: false, message: 'Unauthorized for this meeting' });
      }

      const connectionString = process.env.ACS_CONNECTION_STRING;
      if (!connectionString) {
        return res.status(500).json({ success: false, message: 'Azure connection string not configured' });
      }

      const identityClient = new CommunicationIdentityClient(connectionString);
      const userToken = await identityClient.createUserAndToken(["voip"]);

      res.status(200).json({
        success: true,
        token: userToken.token,
        user: userToken.user,
        groupId: appointmentId
      });
    } catch (error) {
      console.error('Error generating token:', error);
      next(error);
    }
  }

  static async endCall(req, res, next) {
    try {
      const { appointmentId } = req.body;
      if (req.user.role !== 'Doctor') {
         return res.status(403).json({ success: false, message: 'Only doctor can end call' });
      }
      
      const query = `UPDATE appointments SET status = 'Completed' WHERE id = $1 RETURNING *`;
      const result = await db.query(query, [appointmentId]);
      
      const io = req.app.get('io');
      if (io) {
        io.emit('callEnded', { appointmentId });
      }

      res.status(200).json({ success: true, appointment: result.rows[0] });
    } catch (error) {
       next(error);
    }
  }
}
module.exports = TelemedicineController;
