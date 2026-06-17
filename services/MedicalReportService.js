const db = require('../config/db');
const { encryptText, decryptText } = require('../utils/cryptoUtils');
const ApiError = require('../utils/ApiError');

class MedicalReportService {
  static async createReport(doctor_id, bodyData, file) {
    const { appointment_id, symptoms, treatment_plan, title } = bodyData;
    
    const appointmentRes = await db.query('SELECT patient_id FROM appointments WHERE id = $1', [appointment_id]);
    if (appointmentRes.rows.length === 0) {
      throw new ApiError(404, 'Appointment not found');
    }
    const patient_id = appointmentRes.rows[0].patient_id;
    
    const fileData = file ? file.buffer : null;
    const fileMimeType = file ? file.mimetype : null;
    const fileName = file ? file.originalname : null;

    const encryptedSymptoms = encryptText(symptoms);
    const encryptedTreatmentPlan = encryptText(treatment_plan);
    
    const result = await db.query(
      `INSERT INTO medical_reports 
       (patient_id, appointment_id, title, symptoms, treatment_plan, file_data, file_mimetype, file_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, patient_id, appointment_id, title, created_at`,
      [patient_id, appointment_id, title || 'Medical Report', encryptedSymptoms, encryptedTreatmentPlan, fileData, fileMimeType, fileName]
    );

    return { report: result.rows[0] };
  }

  static async getMyReports(patientId) {
    const result = await db.query(
      `SELECT * FROM medical_reports WHERE patient_id = $1 ORDER BY created_at DESC`,
      [patientId]
    );

    const decryptedReports = result.rows.map(report => {
      let attachment_base64 = null;
      if (report.file_data && report.file_mimetype) {
        attachment_base64 = `data:${report.file_mimetype};base64,${report.file_data.toString('base64')}`;
      }

      return {
        id: report.id,
        patient_id: report.patient_id,
        title: report.title,
        created_at: report.created_at,
        symptoms: decryptText(report.symptoms),
        treatment_plan: decryptText(report.treatment_plan),
        file_name: report.file_name,
        file_mimetype: report.file_mimetype,
        attachment_base64: attachment_base64
      };
    });

    return { reports: decryptedReports };
  }

  static async getPatientReports(patientId) {
    const result = await db.query(
      `SELECT * FROM medical_reports WHERE patient_id = $1 ORDER BY created_at DESC`,
      [patientId]
    );

    const decryptedReports = result.rows.map(report => {
      let attachment_base64 = null;
      if (report.file_data && report.file_mimetype) {
        attachment_base64 = `data:${report.file_mimetype};base64,${report.file_data.toString('base64')}`;
      }

      return {
        id: report.id,
        patient_id: report.patient_id,
        title: report.title,
        created_at: report.created_at,
        symptoms: decryptText(report.symptoms),
        treatment_plan: decryptText(report.treatment_plan),
        file_name: report.file_name,
        file_mimetype: report.file_mimetype,
        attachment_base64: attachment_base64
      };
    });

    return { reports: decryptedReports };
  }

  static async getReportByAppointment(appointmentId) {
    const result = await db.query(
      `SELECT * FROM medical_reports WHERE appointment_id = $1 LIMIT 1`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return { report: null };
    }

    const report = result.rows[0];
    
    let attachment_base64 = null;
    if (report.file_data && report.file_mimetype) {
      attachment_base64 = `data:${report.file_mimetype};base64,${report.file_data.toString('base64')}`;
    }

    const decryptedReport = {
      id: report.id,
      patient_id: report.patient_id,
      appointment_id: report.appointment_id,
      title: report.title,
      created_at: report.created_at,
      symptoms: decryptText(report.symptoms),
      treatment_plan: decryptText(report.treatment_plan),
      file_name: report.file_name,
      file_mimetype: report.file_mimetype,
      attachment_base64: attachment_base64
    };

    return { report: decryptedReport };
  }

  static async updateReport(id, bodyData, file) {
    const { title, symptoms, treatment_plan } = bodyData;
    
    const encryptedSymptoms = encryptText(symptoms);
    const encryptedTreatmentPlan = encryptText(treatment_plan);

    let query, params;

    if (file) {
      const fileData = file.buffer;
      const fileMimeType = file.mimetype;
      const fileName = file.originalname;

      query = `
        UPDATE medical_reports 
        SET title = $1, symptoms = $2, treatment_plan = $3, file_data = $4, file_mimetype = $5, file_name = $6
        WHERE id = $7
        RETURNING id, title, created_at
      `;
      params = [title || 'Medical Report', encryptedSymptoms, encryptedTreatmentPlan, fileData, fileMimeType, fileName, id];
    } else {
      query = `
        UPDATE medical_reports 
        SET title = $1, symptoms = $2, treatment_plan = $3
        WHERE id = $4
        RETURNING id, title, created_at
      `;
      params = [title || 'Medical Report', encryptedSymptoms, encryptedTreatmentPlan, id];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Report not found');
    }

    return { report: result.rows[0] };
  }
}

module.exports = MedicalReportService;
