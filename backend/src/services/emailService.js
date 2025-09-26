import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    // Create transporter with Gmail configuration
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'maadhavagarwal39@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'yyzm gngt ehtz momk'
      }
    });
  }

  /**
   * Send verification result email
   * @param {string} recipientEmail - Email address to send to
   * @param {Object} verificationResult - The verification result object
   * @param {string} certificateId - The certificate ID that was verified
   */
  async sendVerificationResult(recipientEmail, verificationResult, certificateId) {
    try {
      const isVerified = verificationResult.success;
      const subject = `Certificate Verification Result - ${isVerified ? 'VERIFIED' : 'FAILED'}`;
      
      const htmlContent = this.generateVerificationEmail(verificationResult, certificateId);
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'maadhavagarwal39@gmail.com',
        to: recipientEmail,
        subject: subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.response);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate HTML email content for verification results
   * @param {Object} verificationResult - The verification result object
   * @param {string} certificateId - The certificate ID
   * @returns {string} HTML email content
   */
  generateVerificationEmail(verificationResult, certificateId) {
    const isVerified = verificationResult.success;
    const statusColor = isVerified ? '#10B981' : '#EF4444';
    const statusText = isVerified ? 'VERIFIED' : 'VERIFICATION FAILED';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate Verification Result</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #374151;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 32px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 32px;
                padding-bottom: 24px;
                border-bottom: 2px solid #e5e7eb;
            }
            .status-badge {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 6px;
                color: white;
                font-weight: 600;
                font-size: 14px;
                background-color: ${statusColor};
            }
            .certificate-id {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin: 16px 0;
            }
            .verification-details {
                margin: 24px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #f3f4f6;
            }
            .detail-label {
                font-weight: 500;
                color: #6b7280;
            }
            .status-pass {
                color: #10B981;
                font-weight: 600;
            }
            .status-fail {
                color: #EF4444;
                font-weight: 600;
            }
            .signature-details {
                background-color: #f8fafc;
                padding: 16px;
                border-radius: 8px;
                margin: 16px 0;
            }
            .footer {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
            .timestamp {
                font-size: 14px;
                color: #9ca3af;
                margin-top: 16px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0 0 16px 0; color: #1f2937;">Certificate Verification Report</h1>
                <div class="status-badge">${statusText}</div>
                <div class="certificate-id">Certificate ID: ${certificateId}</div>
            </div>

            <div class="verification-details">
                <h2 style="color: #1f2937; margin-bottom: 20px;">Verification Results</h2>
                
                <div class="detail-row">
                    <span class="detail-label">Document Check:</span>
                    <span class="${verificationResult.documentCheck ? 'status-pass' : 'status-fail'}">
                        ${verificationResult.documentCheck ? 'PASS' : 'FAIL'}
                    </span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Blockchain Verification:</span>
                    <span class="${verificationResult.blockchainVerification ? 'status-pass' : 'status-fail'}">
                        ${verificationResult.blockchainVerification ? 'PASS' : 'FAIL'}
                    </span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Integrity Check:</span>
                    <span class="${verificationResult.integrityCheck ? 'status-pass' : 'status-fail'}">
                        ${verificationResult.integrityCheck ? 'PASS' : 'FAIL'}
                    </span>
                </div>

                ${verificationResult.signatureVerification ? `
                <div class="signature-details">
                    <h3 style="margin: 0 0 12px 0; color: #1f2937;">Signature Analysis</h3>
                    <div class="detail-row" style="border-bottom: none;">
                        <span class="detail-label">Detection Result:</span>
                        <span class="${verificationResult.signatureVerification.isReal ? 'status-pass' : 'status-fail'}">
                            ${verificationResult.signatureVerification.isReal ? 'REAL' : 'FORGED'}
                        </span>
                    </div>
                    <div class="detail-row" style="border-bottom: none;">
                        <span class="detail-label">Confidence Score:</span>
                        <span style="font-weight: 600;">
                            ${Math.round(verificationResult.signatureVerification.confidence || 0)}%
                        </span>
                    </div>
                </div>
                ` : ''}

                ${verificationResult.transactionHash ? `
                <div class="detail-row">
                    <span class="detail-label">Blockchain Transaction:</span>
                    <span style="font-family: monospace; font-size: 12px; word-break: break-all;">
                        ${verificationResult.transactionHash}
                    </span>
                </div>
                ` : ''}
            </div>

            <div class="footer">
                <p>This is an automated verification report generated by the Certificate Verification System.</p>
                <p>For any questions or concerns, please contact the issuing institution.</p>
                <div class="timestamp">
                    Generated on: ${new Date(verificationResult.verificationDate).toLocaleString()}
                </div>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Send OTP email (keeping the original functionality)
   * @param {string} recipientEmail - Email address to send to
   * @param {string} otp - OTP code to send
   */
  async sendOTP(recipientEmail, otp) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'maadhavagarwal39@gmail.com',
        to: recipientEmail,
        subject: 'Your OTP Code',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Your OTP Code</h2>
            <p>Your OTP code is:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent:', info.response);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      console.error('Email service configuration error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();