const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

class AuthController {
  /**
   * @route   POST /api/auth/register
   * @desc    Register a new user
   * @access  Public
   */
  static async registerUser(req, res, next) {
    try {
      const { full_name, email, password, role, mobile_number } = req.body;

      // 1. Validate required fields
      if (!full_name || !email || !password || !role) {
        res.status(400);
        return next(new Error('Please provide full_name, email, password, and role.'));
      }

      // 2. Validate role matches ENUM
      const allowedRoles = ['Patient', 'Doctor', 'Receptionist', 'Admin'];
      if (!allowedRoles.includes(role)) {
        res.status(400);
        return next(new Error(`Invalid role. Allowed roles are: ${allowedRoles.join(', ')}`));
      }

      // 3. Check if user already exists
      const userExists = await User.findByEmail(email);
      if (userExists) {
        res.status(400);
        return next(new Error('User already exists with this email.'));
      }

      // 4. Hash the password securely
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // 4.5. Generate OTP
      const otp_code = Math.floor(100000 + Math.random() * 900000).toString();

      // 5. Create user in the database
      const newUser = await User.createUser({
        full_name,
        email,
        password_hash,
        role,
        mobile_number: mobile_number || null,
        otp_code
      });

      // 6. Send OTP via email
      await sendEmail(
        email, 
        'CareSync Verification Code', 
        `Welcome to CareSync!\n\nYour verification code is: ${otp_code}\n\nPlease enter this code to complete your registration.`
      );

      // 7. Return success response (without JWT)
      res.status(200).json({
        success: true,
        message: 'User registered successfully. Please check your email for the verification code.',
        user: {
          id: newUser.id,
          full_name: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
          mobile_number: newUser.mobile_number,
          blood_group: newUser.blood_group,
          allergies: newUser.allergies,
          is_verified: newUser.is_verified,
          created_at: newUser.created_at
        }
      });

    } catch (error) {
      // Pass any unexpected errors to the centralized error handler
      next(error);
    }
  }

  /**
   * @route   POST /api/auth/login
   * @desc    Authenticate user and get token
   * @access  Public
   */
  static async loginUser(req, res, next) {
    try {
      const { email, password } = req.body;

      // 1. Validate required fields
      if (!email || !password) {
        res.status(400);
        return next(new Error('Please provide email and password.'));
      }

      // 2. Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        res.status(401);
        return next(new Error('Invalid credentials'));
      }

      // 3. Verify the password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.status(401);
        return next(new Error('Invalid credentials'));
      }

      // 4. Generate JWT Token
      const payload = {
        id: user.id,
        role: user.role
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'supersecretjwtkey12345!',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // 5. Return success response (excluding password)
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token: `Bearer ${token}`,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          blood_group: user.blood_group,
          allergies: user.allergies,
          face_descriptor: user.face_descriptor,
          profile_completed: user.profile_completed,
          created_at: user.created_at
        }
      });

    } catch (error) {
      next(error);
    }
  }
  /**
   * @route   POST /api/auth/verify-otp
   * @desc    Verify OTP and return JWT
   * @access  Public
   */
  static async verifyOTP(req, res, next) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400);
        return next(new Error('Please provide email and otp.'));
      }

      const user = await User.findByEmail(email);
      if (!user) {
        res.status(404);
        return next(new Error('User not found.'));
      }

      if (user.otp_code !== otp) {
        res.status(400);
        return next(new Error('Invalid OTP.'));
      }

      // Update user is_verified status and clear OTP
      const updatedUser = await User.verifyUser(email);

      // Generate the final JWT token
      const payload = {
        id: updatedUser.id,
        role: updatedUser.role
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'supersecretjwtkey12345!',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully. Login complete.',
        token: `Bearer ${token}`,
        user: {
          id: updatedUser.id,
          full_name: updatedUser.full_name,
          email: updatedUser.email,
          role: updatedUser.role,
          is_verified: updatedUser.is_verified,
          created_at: updatedUser.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
