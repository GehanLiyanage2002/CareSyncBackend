const axios = require('axios');

async function test() {
  try {
    // We need an admin token. Let's just create a quick token.
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 'admin-id', role: 'Admin' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
    
    console.log("Token:", token);

    const res = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Stats Response:", JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error("HTTP Error:", error.response?.data || error.message);
  }
}
test();
