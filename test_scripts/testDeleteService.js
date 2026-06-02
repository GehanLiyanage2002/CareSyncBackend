const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create admin token
const token = jwt.sign({ id: 1, role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const headers = { 
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function run() {
  try {
    // 1. Create a dummy service
    console.log('Creating dummy service...');
    const createRes = await fetch('http://localhost:5000/api/services', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Delete Test Service',
        description: 'Testing Delete',
        location: 'Room 99',
        price: '5000'
      })
    });
    
    const createData = await createRes.json();
    if (!createData.success) {
      console.error('Failed to create:', createData);
      return;
    }
    
    const serviceId = createData.service.id;
    console.log('Created service with ID:', serviceId);
    
    // 2. Fetch all services to confirm it is there
    const fetchRes = await fetch('http://localhost:5000/api/services', { headers });
    const fetchData = await fetchRes.json();
    const exists = fetchData.services.find(s => s.id === serviceId);
    console.log('Service exists in list:', !!exists);
    
    // 3. Delete the service
    console.log('Deleting service ID:', serviceId);
    const deleteRes = await fetch(`http://localhost:5000/api/services/${serviceId}`, {
      method: 'DELETE',
      headers
    });
    
    const deleteData = await deleteRes.json();
    console.log('Delete response:', deleteData);
    
    if (deleteData.success) {
      console.log('✅ TEST PASSED: Service successfully deleted!');
    } else {
      console.log('❌ TEST FAILED: Service not deleted.');
    }
    
  } catch (err) {
    console.error('Error during test:', err);
  }
}

run();
