const User = require('../models/User');
const DoctorModel = require('../models/doctorModel');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/cryptoUtils');
const ApiError = require('../utils/ApiError');

class UserService {
  static async updatePatientProfile(userId, userRole, bodyData, io) {
    const { blood_group, allergies, chronic_conditions, emergency_contact_name, emergency_contact_number, address, date_of_birth } = bodyData;

    if (userRole !== 'Patient') {
      throw new ApiError(403, 'Only patients can update their medical profile through this endpoint.');
    }

    const PatientModel = require('../models/patientModel');
    const updatedUser = await PatientModel.upsertProfile(userId, { 
      blood_group, 
      allergies, 
      chronic_conditions, 
      emergency_contact_name, 
      emergency_contact_number,
      address,
      date_of_birth
    });

    if (!updatedUser) {
      throw new ApiError(404, 'User not found or not a patient.');
    }

    if (io) {
      io.emit('patientUpdated', { id: userId });
    }

    return { user: updatedUser };
  }

  static async updateGeneralProfile(userId, bodyData, io) {
    const { full_name, mobile_number } = bodyData;

    if (!full_name) {
      throw new ApiError(400, 'Full name is required.');
    }

    const updatedUser = await User.updateGeneralProfile(userId, { full_name, mobile_number });
    
    if (!updatedUser) {
      throw new ApiError(404, 'User not found.');
    }

    if (io) {
      io.emit('patientUpdated', { id: userId });
    }

    return { user: updatedUser };
  }

  static async changePassword(userId, bodyData) {
    const { currentPassword, newPassword } = bodyData;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Please provide both current and new passwords.');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      throw new ApiError(404, 'User not found.');
    }
    
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isMatch) {
      throw new ApiError(400, 'Incorrect current password.');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    const success = await User.updatePassword(userId, newPasswordHash);
    if (!success) {
      throw new ApiError(400, 'Failed to update password.');
    }

    return {};
  }

  static async updateDoctorProfile(userId, userRole, bodyData, io) {
    const { specialization, experience, bio, location, qualifications } = bodyData;

    if (userRole !== 'Doctor') {
      throw new ApiError(403, 'Only doctors can update their professional profile.');
    }

    const updatedProfile = await DoctorModel.upsertProfile(userId, { specialization, experience, bio, location, qualifications });

    if (!updatedProfile) {
      throw new ApiError(400, 'Failed to update doctor profile.');
    }

    if (io) {
      io.emit('doctorProfileUpdated', {
        doctor_id: userId,
        location: updatedProfile.location,
        specialization: updatedProfile.specialization,
        experience: updatedProfile.experience,
        bio: updatedProfile.bio,
        qualifications: updatedProfile.qualifications
      });
    }

    UserService.clearDoctorsCache();

    return { profile: updatedProfile };
  }

  static async getDoctorProfile(userId, userRole) {
    if (userRole !== 'Doctor') {
      throw new ApiError(403, 'Only doctors can access this profile.');
    }

    const profile = await DoctorModel.getProfileByDoctorId(userId);

    if (!profile) {
      throw new ApiError(404, 'Doctor profile not found.');
    }

    return { profile };
  }

  // Simple in-memory cache for doctors
  static _doctorsCache = {
    data: {},
    timestamp: {}
  };

  static clearDoctorsCache() {
    UserService._doctorsCache.data = {};
    UserService._doctorsCache.timestamp = {};
  }

  static async getAvailableDoctors(date) {
    const cacheKey = date || 'all';
    const cacheExpiryMs = 5 * 60 * 1000; // 5 minutes cache
    
    // Return cached data if valid
    if (
      UserService._doctorsCache.data[cacheKey] && 
      (Date.now() - UserService._doctorsCache.timestamp[cacheKey]) < cacheExpiryMs
    ) {
      console.log(`[UserService] Cache HIT for key: ${cacheKey}`);
      return {
        doctors: UserService._doctorsCache.data[cacheKey],
        cached: true
      };
    }
    
    console.log(`[UserService] Cache MISS for key: ${cacheKey}. Fetching from DB...`);

    let query = `
      SELECT 
        u.id as doctor_id, 
        u.full_name as name, 
        dp.specialization, 
        dp.experience, 
        dp.bio as about,
        dp.is_available,
        '95%' as "successRate", 
        '1k+' as patients, 
        COALESCE(dp.qualifications, '') as qualifications,
        COALESCE(dp.location, 'Not specified') as location,
        COALESCE(dp.consultation_fee, 1500) as "consultationFee",
        '4.8' as rating,
        (SELECT json_agg(schedule_date) FROM doctor_schedules ds WHERE ds.doctor_id = u.id AND ds.schedule_date >= CURRENT_DATE) as schedule_dates
      FROM users u
      LEFT JOIN doctor_profiles dp ON u.id = dp.doctor_id
      WHERE u.role = 'Doctor' AND dp.is_approved = true
    `;
    
    const queryParams = [];
    if (date) {
      query += ` AND EXISTS (SELECT 1 FROM doctor_schedules ds WHERE ds.doctor_id = u.id AND ds.schedule_date = $1)`;
      queryParams.push(date);
    }
    
    const result = await db.query(query, queryParams);
    
    const doctors = result.rows.map(doc => {
      let parsedDates = [];
      if (doc.schedule_dates) {
        parsedDates = doc.schedule_dates.map(d => {
          const dateObj = new Date(d);
          return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        });
      }

      return {
        ...doc,
        specialization: doc.specialization ? decrypt(doc.specialization) : 'Not Specified',
        experience: doc.experience ? decrypt(doc.experience) : 'Not Specified',
        about: doc.about ? decrypt(doc.about) : 'No bio available',
        qualifications: doc.qualifications ? decrypt(doc.qualifications) : 'Not Specified',
        image: `http://localhost:5000/api/users/profile-image/${doc.doctor_id}`,
        schedule_dates: parsedDates
      };
    });

    UserService._doctorsCache.data[cacheKey] = doctors;
    UserService._doctorsCache.timestamp[cacheKey] = Date.now();

    return { doctors };
  }

  static async updateFaceId(userId, bodyData) {
    const { faceDescriptor } = bodyData;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      throw new ApiError(400, 'Invalid face descriptor provided.');
    }

    const encryptedDescriptor = encrypt(JSON.stringify(faceDescriptor));
    
    const query = `
      UPDATE users 
      SET face_descriptor = $1
      WHERE id = $2
      RETURNING id;
    `;
    
    const result = await db.query(query, [encryptedDescriptor, userId]);

    if (result.rowCount === 0) {
      throw new ApiError(404, 'User not found.');
    }

    return {};
  }

  static async updateProfileImage(userId, fileData, io) {
    if (!fileData || !fileData.buffer || !fileData.mimetype) {
      throw new ApiError(400, 'No image file provided.');
    }

    await db.query(
      'UPDATE users SET profile_image = $1, profile_image_mimetype = $2 WHERE id = $3',
      [fileData.buffer, fileData.mimetype, userId]
    );

    if (io) {
      io.emit('profileImageUpdated', { user_id: userId });
    }

    return {
      imageUrl: `http://localhost:5000/api/users/profile-image/${userId}?t=${Date.now()}`
    };
  }

  static async getProfileImage(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return null;
    }

    const result = await db.query(
      'SELECT profile_image, profile_image_mimetype FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].profile_image) {
      return null;
    }

    return result.rows[0];
  }
}

module.exports = UserService;
