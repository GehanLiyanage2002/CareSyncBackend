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

    if (!['Upcoming', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

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
