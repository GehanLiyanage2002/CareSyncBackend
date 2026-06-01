const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        role: 'Patient',
        mobile_number: '1234567890'
      })
    });
    const json = await res.json();
    console.log('Response:', json);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
