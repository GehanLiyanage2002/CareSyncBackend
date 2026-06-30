const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: 'a17e00ec-2bc6-4295-a3ce-ad996303349a', role: 'Patient' }, 
  process.env.JWT_SECRET || 'supersecretjwtkey12345!', 
  { expiresIn: '1d' }
);

async function testUpdate() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/users/general', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: 'Test Update',
        mobile_number: '0711234567'
      })
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

testUpdate();
