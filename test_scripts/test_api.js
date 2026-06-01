const jwt = require('jsonwebtoken');

async function testGetBookings() {
  try {
    const token = jwt.sign(
      { id: '1a0911fe-21a4-4488-ac7c-ac334a8ca359', email: 'chamikara@gmail.com', role: 'Patient' },
      process.env.JWT_SECRET || 'supersecretjwtkey12345!',
      { expiresIn: '1d' }
    );
    console.log("Token generated for real patient!");

    const bookRes = await fetch('http://localhost:5000/api/services/bookings', {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      }
    });
    
    const bookData = await bookRes.json();

    if (!bookRes.ok) {
      console.error("ERROR RESPONSE:", bookData);
    } else {
      console.log("SUCCESS:", bookData);
    }
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

testGetBookings();
