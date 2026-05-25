const DoctorModel = require('../models/doctorModel');
const db = require('../config/db');

exports.getProfile = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const profile = await DoctorModel.getProfileByDoctorId(doctorId);
    
    // Also fetch base user info
    const userResult = await db.query('SELECT full_name, email, mobile_number FROM users WHERE id = $1', [doctorId]);
    const userInfo = userResult.rows[0];

    res.status(200).json({ 
      success: true, 
      profile: profile || {}, 
      user: userInfo || {} 
    });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { specialization, experience, bio, full_name, email, mobile_number } = req.body;
    
    // Upsert profile data
    const updatedProfile = await DoctorModel.upsertProfile(doctorId, {
      specialization, experience, bio
    });

    // Optionally update user data if provided
    if (full_name || mobile_number) {
      await db.query(
        'UPDATE users SET full_name = COALESCE($1, full_name), mobile_number = COALESCE($2, mobile_number) WHERE id = $3',
        [full_name, mobile_number, doctorId]
      );
    }

    res.status(200).json({ success: true, profile: updatedProfile, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateFee = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { fee } = req.body;
    
    if (fee === undefined || isNaN(fee) || fee < 0) {
      return res.status(400).json({ success: false, message: 'Valid consultation fee is required' });
    }

    const updatedProfile = await DoctorModel.updateConsultationFee(doctorId, fee);
    
    // Emit socket event for realtime update
    const io = req.app.get('io');
    if (io) {
      io.emit('doctorFeeChanged', { doctor_id: doctorId, consultation_fee: fee });
    }
    
    res.status(200).json({ success: true, profile: updatedProfile, message: 'Consultation fee updated successfully' });
  } catch (error) {
    console.error('Error updating consultation fee:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appointments = await DoctorModel.getAppointmentsByDoctorId(doctorId);
    res.status(200).json({ success: true, appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Notice we don't have updateAppointmentStatus in the new DoctorModel, but keeping signature
    const updated = await DoctorModel.updateAppointmentStatus(id, doctorId, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({ success: true, appointment: updated });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const schedule = await DoctorModel.getScheduleByDoctorId(doctorId);
    res.status(200).json({ success: true, schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { schedule_date, start_time, end_time, slot_duration_minutes } = req.body;

    if (!schedule_date) {
      return res.status(400).json({ success: false, message: 'Schedule date is required' });
    }

    const updatedSchedule = await DoctorModel.upsertSchedule(doctorId, {
      schedule_date, start_time, end_time, slot_duration_minutes
    });

    res.status(200).json({ success: true, schedule: updatedSchedule, message: 'Schedule updated successfully' });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
