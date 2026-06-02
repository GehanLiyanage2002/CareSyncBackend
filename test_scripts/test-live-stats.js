const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: 'admin-static-id', role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
const bearerToken = `Bearer ${token}`;

console.log('Sending request to /api/admin/stats with token:', bearerToken.substring(0, 60) + '...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/stats',
  method: 'GET',
  headers: {
    'Authorization': bearerToken,
    'Content-Type': 'application/json'
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

req.end();
