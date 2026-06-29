const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email using nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email plain text content
 * @param {string} [html] - Optional HTML content. If not provided, a default template is used.
 * @returns {Object} Info object from nodemailer
 */
const sendEmail = async (to, subject, text, html) => {
  if (!process.env.SMTP_HOST) {
    console.warn(`[Mock Email] Would have sent email to ${to}`);
    console.warn(`Subject: ${subject}`);
    console.warn(`Text: ${text}`);
    return { messageId: 'mock-id' };
  }

  try {
    let finalHtml = html;
    
    // If no HTML is provided, wrap the text in the beautiful default template
    if (!finalHtml) {
      finalHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">CareSync</h1>
          </div>
          <div style="padding: 32px; background-color: #ffffff; color: #374151; font-size: 16px; line-height: 1.6;">
            <p style="white-space: pre-wrap; margin: 0; color: #1f2937;">${text}</p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">
            <p style="margin: 0; padding-bottom: 8px;">CareSync Medical Center</p>
            <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: `"CareSync" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: finalHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
