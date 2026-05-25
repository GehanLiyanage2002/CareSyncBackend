const User = require('../models/User');

class UserController {
  /**
   * @route   PUT /api/users/profile
   * @desc    Update patient medical profile (blood group, allergies)
   * @access  Private
   */
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
}

module.exports = UserController;
