const db = require('../config/db');
const { encryptText, decryptText } = require('../utils/cryptoUtils');

class MedicalReportController {
  /**
   * @route   POST /api/reports
   * @desc    Create a new medical report with encrypted fields and file attachment
   * @access  Private (Doctor)
   */
  static async createReport(req, res) {
    try {
      const { appointment_id, symptoms, treatment_plan, title } = req.body;
      const doctor_id = req.user.id;
      
      // Get patient_id from the appointment_id to ensure accuracy and avoid undefined errors
      const appointmentRes = await db.query('SELECT patient_id FROM appointments WHERE id = $1', [appointment_id]);
      if (appointmentRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }
      const patient_id = appointmentRes.rows[0].patient_id;
      
      // Get file data from multer (memoryStorage)
      const fileData = req.file ? req.file.buffer : null;
      const fileMimeType = req.file ? req.file.mimetype : null;
      const fileName = req.file ? req.file.originalname : null;

      // Encrypt sensitive data
      const encryptedSymptoms = encryptText(symptoms);
      const encryptedTreatmentPlan = encryptText(treatment_plan);
      
      // We also encrypt the title if it exists, or just leave it as is if it's not sensitive. 
      // The prompt specifically asks to encrypt symptoms and treatment_plan strings.

      const result = await db.query(
        `INSERT INTO medical_reports 
         (patient_id, appointment_id, title, symptoms, treatment_plan, file_data, file_mimetype, file_name) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, patient_id, appointment_id, title, created_at`,
        [patient_id, appointment_id, title || 'Medical Report', encryptedSymptoms, encryptedTreatmentPlan, fileData, fileMimeType, fileName]
      );

      res.status(201).json({ 
        success: true, 
        message: 'Medical report created safely.',
        report: result.rows[0] 
      });
    } catch (error) {
      console.error('Error creating medical report:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  /**
   * @route   GET /api/reports/my-history
   * @desc    Get all medical reports for the currently logged in patient
   * @access  Private (Patient)
   */
  static async getMyReports(req, res) {
    try {
      const patientId = req.user.id;

      const result = await db.query(
        `SELECT * FROM medical_reports WHERE patient_id = $1 ORDER BY created_at DESC`,
        [patientId]
      );

      // Decrypt sensitive strings and format Base64 file
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

      res.status(200).json({ 
        success: true, 
        reports: decryptedReports 
      });
    } catch (error) {
      console.error('Error fetching patient medical history:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  /**
   * @route   GET /api/reports/patient/:patientId
   * @desc    Get all medical reports for a patient, decrypting sensitive data
   * @access  Private
   */
  static async getPatientReports(req, res) {
    try {
      const { patientId } = req.params;

      const result = await db.query(
        `SELECT * FROM medical_reports WHERE patient_id = $1 ORDER BY created_at DESC`,
        [patientId]
      );

      // Decrypt sensitive strings and format Base64 file
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

      res.status(200).json({ 
        success: true, 
        reports: decryptedReports 
      });
    } catch (error) {
      console.error('Error fetching medical reports:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  /**
   * @route   GET /api/reports/appointment/:appointmentId
   * @desc    Get the medical report for a specific appointment
   * @access  Private (Doctor/Patient)
   */
  static async getReportByAppointment(req, res) {
    try {
      const { appointmentId } = req.params;

      const result = await db.query(
        `SELECT * FROM medical_reports WHERE appointment_id = $1 LIMIT 1`,
        [appointmentId]
      );

      if (result.rows.length === 0) {
        return res.status(200).json({ success: true, report: null }); // No report yet
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

      res.status(200).json({ success: true, report: decryptedReport });
    } catch (error) {
      console.error('Error fetching medical report by appointment:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  /**
   * @route   PUT /api/reports/:id
   * @desc    Update an existing medical report
   * @access  Private (Doctor)
   */
  static async updateReport(req, res) {
    try {
      const { id } = req.params;
      const { title, symptoms, treatment_plan } = req.body;
      
      // Encrypt sensitive data
      const encryptedSymptoms = encryptText(symptoms);
      const encryptedTreatmentPlan = encryptText(treatment_plan);

      let query, params;

      if (req.file) {
        const fileData = req.file.buffer;
        const fileMimeType = req.file.mimetype;
        const fileName = req.file.originalname;

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
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      res.status(200).json({ 
        success: true, 
        message: 'Medical report updated successfully.',
        report: result.rows[0] 
      });
    } catch (error) {
      console.error('Error updating medical report:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

module.exports = MedicalReportController;
