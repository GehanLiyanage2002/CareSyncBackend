require('dotenv').config();
const DoctorModel = require('./models/doctorModel');
(async () => {
  try {
    const res = await DoctorModel.upsertProfile('f5fcf515-2259-42ab-b409-60a96c4a0e14', {
      specialization: 'Psychology',
      experience: '10',
      bio: 'New bio test',
      location: 'CareSync Hospital',
      qualifications: 'MBBS'
    });
    console.log(res);
  } catch (e) {
    console.error(e);
  }
  process.exit();
})();
