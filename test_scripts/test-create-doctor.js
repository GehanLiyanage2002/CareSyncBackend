const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: 'admin-static-id', role: 'Admin' }, process.env.JWT_SECRET || 'supersecretjwtkey12345!', { expiresIn: '1d' });
const bearerToken = `Bearer ${token}`;

const body = JSON.stringify({
  full_name: 'Dr. API Test',
  email: `apitest${Date.now()}@test.com`,
  password: 'test1234',
  specialization: 'Neurology',
  experience: '5 years',
  consultation_fee: 2000
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/doctors',
  method: 'POST',
  headers: {
    'Authorization': bearerToken,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
