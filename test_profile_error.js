const jwt = require('jsonwebtoken');
require('dotenv').config();

async function test() {
  try {
    const token = jwt.sign({ id: '855db8b7-6a15-4ba9-bbf2-17b5f5869a84', role: 'Doctor' }, process.env.JWT_SECRET || 'supersecretjwtkey12345!', { expiresIn: '1d' });
    const response = await fetch('http://127.0.0.1:5000/api/doctor/patient/a17e00ec-2bc6-4295-a3ce-ad996303349a/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}
test();
