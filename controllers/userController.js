const User = require('../models/User');
const DoctorModel = require('../models/doctorModel');
const bcrypt = require('bcryptjs');

class UserController {
  // ... existing updatePatientProfile ...

  static async updatePatientProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { blood_group, allergies, chronic_conditions, emergency_contact_name, emergency_contact_number } = req.body;

      if (userRole !== 'Patient') {
        res.status(403);
        return next(new Error('Only patients can update their medical profile through this endpoint.'));
      }

      const updatedUser = await User.updatePatientProfile(userId, { 
        blood_group, 
        allergies, 
        chronic_conditions, 
        emergency_contact_name, 
        emergency_contact_number 
      });

      if (!updatedUser) {
        res.status(404);
        return next(new Error('User not found or not a patient.'));
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/users/general
   * @desc    Update general profile (full_name, mobile_number)
   * @access  Private
   */
  static async updateGeneralProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { full_name, mobile_number } = req.body;

      if (!full_name) {
        res.status(400);
        return next(new Error('Full name is required.'));
      }

      const updatedUser = await User.updateGeneralProfile(userId, { full_name, mobile_number });
      
      if (!updatedUser) {
        res.status(404);
        return next(new Error('User not found.'));
      }

      res.status(200).json({
        success: true,
        message: 'General profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/users/password
   * @desc    Change user password
   * @access  Private
   */
  static async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400);
        return next(new Error('Please provide both current and new passwords.'));
      }

      // Verify current password
      const user = await User.findById(userId);
      if (!user) {
        res.status(404);
        return next(new Error('User not found.'));
      }

      // Check password using bcrypt since the password_hash is stored directly
      // Wait, User.findById doesn't return password_hash. We need a way to get password_hash!
      // Let's create a custom query for this.
      const db = require('../config/db');
      const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        res.status(404);
        return next(new Error('User not found.'));
      }
      
      const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!isMatch) {
        res.status(400);
        return next(new Error('Incorrect current password.'));
      }

      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      const success = await User.updatePassword(userId, newPasswordHash);
      if (!success) {
        res.status(400);
        return next(new Error('Failed to update password.'));
      }

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/users/doctor-profile
   * @desc    Update doctor professional details
   * @access  Private (Doctor only)
   */
  static async updateDoctorProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { specialization, experience, bio, location } = req.body;

      if (userRole !== 'Doctor') {
        res.status(403);
        return next(new Error('Only doctors can update their professional profile.'));
      }

      const updatedProfile = await DoctorModel.upsertProfile(userId, { specialization, experience, bio, location });

      if (!updatedProfile) {
        res.status(400);
        return next(new Error('Failed to update doctor profile.'));
      }

      // Emit socket event for real-time update on doctor profile pages
      const io = req.app?.get('io');
      if (io) {
        io.emit('doctorProfileUpdated', {
          doctor_id: userId,
          location: updatedProfile.location,
          specialization: updatedProfile.specialization,
          experience: updatedProfile.experience,
          bio: updatedProfile.bio
        });
      }

      res.status(200).json({
        success: true,
        message: 'Doctor profile updated successfully',
        profile: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * @route   GET /api/users/doctor-profile
   * @desc    Get doctor professional details
   * @access  Private (Doctor only)
   */
  static async getDoctorProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      if (userRole !== 'Doctor') {
        res.status(403);
        return next(new Error('Only doctors can access this profile.'));
      }

      const profile = await DoctorModel.getProfileByDoctorId(userId);

      if (!profile) {
        res.status(404);
        return next(new Error('Doctor profile not found.'));
      }

      res.status(200).json({
        success: true,
        profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/users/doctors
   * @desc    Get a list of all doctors (optionally filtered by availability)
   * @access  Public
   */
  static async getAvailableDoctors(req, res, next) {
    try {
      const db = require('../config/db');
      const { decrypt } = require('../utils/cryptoUtils');
      
      const query = `
        SELECT 
          u.id as doctor_id, 
          u.full_name as name, 
          dp.specialization, 
          dp.experience, 
          dp.bio as about,
          dp.is_available,
          -- Provide some dummy data for frontend mapping until we fully implement them
          '95%' as "successRate", 
          '1k+' as patients, 
          'MBBS, MD' as qualifications,
          COALESCE(dp.location, 'Not specified') as location,
          COALESCE(dp.consultation_fee, 1500) as "consultationFee",
          '4.8' as rating,
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400' as image
        FROM users u
        LEFT JOIN doctor_profiles dp ON u.id = dp.doctor_id
        WHERE u.role = 'Doctor'
      `;
      
      const result = await db.query(query);
      
      // Decrypt the encrypted fields
      const doctors = result.rows.map(doc => {
        return {
          ...doc,
          specialization: doc.specialization ? decrypt(doc.specialization) : 'Not Specified',
          experience: doc.experience ? decrypt(doc.experience) : 'Not Specified',
          about: doc.about ? decrypt(doc.about) : 'No bio available'
        };
      });

      res.status(200).json({
        success: true,
        doctors
      });
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
}

module.exports = UserController;
