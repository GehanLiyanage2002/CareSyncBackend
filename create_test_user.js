const bcrypt = require('bcryptjs');
const db = require('./config/db');
const User = require('./models/User');
const PatientModel = require('./models/patientModel');

async function createTestUser() {
  try {
    const email = 'kasun.bandara@test.com';
    const password = 'password123';
    
    // Check if user exists
    const existing = await User.findByEmail(email);
    if (existing) {
      console.log('User already exists. Deleting to recreate...');
      await db.query('DELETE FROM users WHERE email = $1', [email]);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const newUser = await User.createUser({
      full_name: 'Kasun Bandara',
      email: email,
      password_hash: password_hash,
      role: 'Patient',
      mobile_number: '0711234567',
      otp_code: '123456',
      face_descriptor: null
    });

    // Manually set verified
    await db.query('UPDATE users SET is_verified = true WHERE id = $1', [newUser.id]);

    await PatientModel.upsertProfile(newUser.id, {
      address: 'Colombo, Sri Lanka',
      date_of_birth: '1995-05-15',
      gender: 'Male'
    });

    console.log('✅ Test user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: Kasun Bandara`);

  } catch (err) {
    console.error('Error creating user:', err);
  } finally {
    process.exit(0);
  }
}

createTestUser();
