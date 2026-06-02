const jwt = require('jsonwebtoken');
require('dotenv').config();

// Read the token from local storage simulation
// The token stored in Redux is "Bearer <actual_jwt>"
// Let's decode a token to check the payload

const db = require('./config/db');

async function test() {
  // Simulate what happens when admin logs in
  const token = jwt.sign({ id: 'admin-static-id', role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const bearerToken = `Bearer ${token}`;
  
  console.log('Full token stored in Redux:', bearerToken.substring(0, 50) + '...');
  
  // Now simulate what authMiddleware does
  const extractedToken = bearerToken.split(' ')[1];
  const decoded = jwt.verify(extractedToken, process.env.JWT_SECRET);
  console.log('Decoded payload:', decoded);
  console.log('Role:', decoded.role);
  console.log('Role === Admin:', decoded.role === 'Admin');
  
  process.exit(0);
}
test();
