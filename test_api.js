const jwt = require('jsonwebtoken');
require('dotenv').config();

async function run() {
  const token = jwt.sign({ id: 'admin-static-id', role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const config = { headers: { Authorization: `Bearer ${token}` } };
  
  async function fetchEndpoint(url) {
    try {
      const res = await fetch(url, config);
      if (res.ok) {
        const json = await res.json();
        console.log(url, 'Type of payload:', typeof json, Array.isArray(json.earnings) ? 'is array' : 'not array');
        if (json.earnings) console.log(json.earnings.slice(0, 1));
      }
    } catch(e) {}
  }

  await fetchEndpoint('http://127.0.0.1:5000/api/admin/earnings');
}
run();
