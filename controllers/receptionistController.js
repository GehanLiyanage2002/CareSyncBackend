const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ReceptionistController = {
  /**
   * Register a walk-in patient
   * POST /api/receptionist/register-patient
   */
  registerWalkInPatient: async (req, res) => {
    try {
      const { 
        name, 
        email, 
        phone, 
        blood_group, 
        emergency_contact_name, 
        emergency_contact_number 
      } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ message: 'Name and phone number are required.' });
      }

      // Generate a dummy email if not provided
      const patientEmail = email || `walkin_${Date.now()}@caresync.local`;

      // Check if email already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: patientEmail }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'A user with this email already exists.' });
      }

      // Default password for walk-in patients
      const defaultPassword = 'walkin123';
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(defaultPassword, salt);

      // Create the patient user with medical details
      const newPatient = await prisma.users.create({
        data: {
          full_name: name,
          email: patientEmail,
          password_hash,
          role: 'Patient',
          mobile_number: phone,
          blood_group: blood_group || null,
          emergency_contact_name: emergency_contact_name || null,
          emergency_contact_number: emergency_contact_number || null,
          is_verified: true, // Auto verify walk-in patients
        }
      });

      // Remove sensitive data before sending response
      const { password_hash: _, ...patientDetails } = newPatient;

      return res.status(201).json({
        message: 'Walk-in patient registered successfully',
        patient: patientDetails
      });
    } catch (error) {
      console.error('Error registering walk-in patient:', error);
      return res.status(500).json({ message: 'Failed to register patient. Please try again.' });
    }
  }
};

module.exports = ReceptionistController;
