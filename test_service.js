const db = require('./config/db');
const MedicalReportService = require('./services/MedicalReportService');

async function checkService() {
  try {
    const patientId = 'a17e00ec-2bc6-4295-a3ce-ad996303349a';
    console.log('Fetching reports for patient:', patientId);
    
    const result = await MedicalReportService.getPatientReports(patientId);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Error fetching reports:', e);
  } finally {
    process.exit();
  }
}

checkService();
