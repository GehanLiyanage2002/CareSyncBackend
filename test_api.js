const db = require('./config/db');

async function testApi() {
  try {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 'a17e00ec-2bc6-4295-a3ce-ad996303349a', role: 'Patient' }, process.env.JWT_SECRET || 'supersecretjwtkey12345!', { expiresIn: '1d' });
    
    const response = await fetch('http://127.0.0.1:5000/api/reports/my-history', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    const fs = require('fs');
    fs.writeFileSync('api_response.json', JSON.stringify(data, null, 2));
    console.log('Saved to api_response.json');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit();
  }
}

testApi();
