import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIService {
  constructor() {
    this.pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
    this.aiScriptsPath = path.join(__dirname, '../../ai');
    this.ocrScriptPath = path.join(this.aiScriptsPath, 'enhanced_ocr.py');
    this.signatureScriptPath = path.join(this.aiScriptsPath, 'Signature-Recognition-with-SiameseNetwork-and-CycleGAN', 'pipeline_yolo_to_signet.py');
    this.tempDir = path.join(__dirname, '../../temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Validate environment variables
    this.validateEnvironment();
  }

  validateEnvironment() {
    const required = ['GEMINI_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
      console.warn('Some AI features may not work properly.');
    }
  }

  /**
   * Extract data from certificate using OCR + Gemini AI
   * @param {string} filePath - Path to the certificate file
   * @returns {Promise<Object>} Extracted certificate data
   */
  async extractCertificateData(filePath) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonExecutable, [
        this.ocrScriptPath,
        '--file-path', filePath,
        '--output-format', 'json'
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`OCR process failed: ${errorOutput}`));
        }

        try {
          // Parse the JSON output from the Python script
          const lines = output.trim().split('\n');
          const jsonLine = lines.find(line => {
            try {
              JSON.parse(line);
              return true;
            } catch {
              return false;
            }
          });

          if (!jsonLine) {
            throw new Error('No valid JSON found in OCR output');
          }

          const extractedData = JSON.parse(jsonLine);
          
          // Normalize the extracted data to match our schema
          const normalizedData = this.normalizeExtractedData(extractedData);
          
          resolve(normalizedData);
        } catch (error) {
          reject(new Error(`Failed to parse OCR output: ${error.message}`));
        }
      });
    });
  }

  /**
   * Verify signature authenticity using AI pipeline
   * @param {string} certificateImagePath - Path to certificate image
   * @param {string} anchorSignaturePath - Path to reference signature
   * @returns {Promise<Object>} Signature verification results
   */
  async verifySignature(certificateImagePath, anchorSignaturePath) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonExecutable, [
        this.signatureScriptPath,
        '--certificate-path', certificateImagePath,
        '--anchor-path', anchorSignaturePath,
        '--output-format', 'json'
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Signature verification failed: ${errorOutput}`));
        }

        try {
          const results = JSON.parse(output.trim());
          
          // Process signature verification results
          const processed = this.processSignatureResults(results);
          
          resolve(processed);
        } catch (error) {
          reject(new Error(`Failed to parse signature verification output: ${error.message}`));
        }
      });
    });
  }

  /**
   * Complete AI processing pipeline for a certificate
   * @param {string} filePath - Path to certificate file
   * @param {string} studentId - Student ID for reference signature lookup
   * @param {string} institutionCode - Institution code
   * @returns {Promise<Object>} Complete AI analysis results
   */
  async processCertificate(filePath, studentId = null, institutionCode = null) {
    try {
      // Step 1: Extract certificate data using OCR + AI
      console.log('🤖 Starting OCR and data extraction...');
      const extractedData = await this.extractCertificateData(filePath);
      
      // Step 2: Generate document hash
      const documentHash = await this.generateDocumentHash(filePath);
      
      // Step 3: Signature verification (if reference signature available)
      let signatureResults = null;
      
      if (studentId || extractedData.roll_number) {
        const referenceId = studentId || extractedData.roll_number;
        const referencePath = await this.findReferenceSignature(referenceId, institutionCode);
        
        if (referencePath) {
          console.log('🔍 Verifying signature...');
          signatureResults = await this.verifySignature(filePath, referencePath);
        }
      }

      // Step 4: Combine results
      const aiResults = {
        extractedData,
        documentHash,
        signatureVerification: signatureResults,
        processingTimestamp: new Date().toISOString(),
        confidence: this.calculateOverallConfidence(extractedData, signatureResults),
        fraudScore: this.calculateFraudScore(extractedData, signatureResults),
        recommendations: this.generateRecommendations(extractedData, signatureResults)
      };

      console.log('✅ AI processing completed');
      return aiResults;

    } catch (error) {
      console.error('❌ AI processing failed:', error);
      throw error;
    }
  }

  /**
   * Process multiple certificates in bulk
   * @param {Array} filePaths - Array of certificate file paths
   * @param {string} institutionCode - Institution code
   * @returns {Promise<Array>} Array of processing results
   */
  async processBulkCertificates(filePaths, institutionCode) {
    const results = [];
    
    for (let i = 0; i < filePaths.length; i++) {
      try {
        console.log(`📄 Processing certificate ${i + 1}/${filePaths.length}...`);
        const result = await this.processCertificate(filePaths[i], null, institutionCode);
        results.push({
          success: true,
          filePath: filePaths[i],
          ...result
        });
      } catch (error) {
        console.error(`❌ Failed to process ${filePaths[i]}:`, error);
        results.push({
          success: false,
          filePath: filePaths[i],
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Normalize extracted data to match database schema
   */
  normalizeExtractedData(rawData) {
    return {
      certificate_id: rawData.certificate_id || rawData.certificateId || rawData.cert_id || null,
      student_name: rawData.name || rawData.student_name || rawData.studentName || null,
      roll_number: rawData.roll_number || rawData.rollNumber || rawData.roll || null,
      marks: rawData.marks || rawData.grade || rawData.cgpa || rawData.percentage || null,
      course: rawData.course || rawData.program || rawData.degree || null,
      institution: rawData.institution || rawData.college || rawData.university || null,
      issue_date: rawData.issue_date || rawData.issueDate || rawData.date || null,
      raw_text: rawData.raw_text || '',
      confidence: rawData.confidence || 0.8
    };
  }

  /**
   * Process signature verification results
   */
  processSignatureResults(results) {
    if (!results || !Array.isArray(results)) {
      return { status: 'error', message: 'Invalid signature verification results' };
    }

    const genuineCount = results.filter(r => r.label === 'Genuine').length;
    const forgedCount = results.filter(r => r.label === 'Forged').length;
    const totalSignatures = results.length;

    let status;
    if (totalSignatures === 0) {
      status = 'no_signatures_found';
    } else if (genuineCount > forgedCount) {
      status = 'verified';
    } else if (forgedCount > genuineCount) {
      status = 'fraud';
    } else {
      status = 'suspicious';
    }

    return {
      status,
      totalSignatures,
      genuineCount,
      forgedCount,
      confidence: totalSignatures > 0 ? genuineCount / totalSignatures : 0,
      details: results
    };
  }

  /**
   * Calculate overall confidence score
   */
  calculateOverallConfidence(extractedData, signatureResults) {
    let confidence = 0;
    let factors = 0;

    // OCR confidence
    if (extractedData.confidence) {
      confidence += extractedData.confidence;
      factors++;
    }

    // Signature confidence
    if (signatureResults && signatureResults.confidence !== undefined) {
      confidence += signatureResults.confidence;
      factors++;
    }

    return factors > 0 ? confidence / factors : 0.5;
  }

  /**
   * Calculate fraud risk score (0 = low risk, 1 = high risk)
   */
  calculateFraudScore(extractedData, signatureResults) {
    let riskFactors = 0;
    let totalFactors = 0;

    // Missing critical data
    if (!extractedData.certificate_id) riskFactors += 0.3;
    if (!extractedData.student_name) riskFactors += 0.2;
    if (!extractedData.roll_number) riskFactors += 0.2;
    totalFactors += 0.7;

    // Signature analysis
    if (signatureResults) {
      if (signatureResults.status === 'fraud') riskFactors += 0.4;
      else if (signatureResults.status === 'suspicious') riskFactors += 0.2;
      totalFactors += 0.4;
    }

    return Math.min(riskFactors, 1.0);
  }

  /**
   * Generate recommendations based on AI analysis
   */
  generateRecommendations(extractedData, signatureResults) {
    const recommendations = [];

    // Data quality recommendations
    if (!extractedData.certificate_id) {
      recommendations.push({
        type: 'data_missing',
        severity: 'high',
        message: 'Certificate ID not found - manual verification required'
      });
    }

    if (!extractedData.student_name || !extractedData.roll_number) {
      recommendations.push({
        type: 'data_incomplete',
        severity: 'medium',
        message: 'Student information incomplete - verify with institution'
      });
    }

    // Signature recommendations
    if (signatureResults) {
      if (signatureResults.status === 'fraud') {
        recommendations.push({
          type: 'signature_fraud',
          severity: 'critical',
          message: 'Signature analysis indicates potential forgery - immediate investigation required'
        });
      } else if (signatureResults.status === 'suspicious') {
        recommendations.push({
          type: 'signature_suspicious',
          severity: 'high',
          message: 'Signature verification inconclusive - additional verification recommended'
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate document hash for blockchain storage
   */
  async generateDocumentHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Find reference signature for a student
   */
  async findReferenceSignature(studentId, institutionCode) {
    // This would typically query a database of reference signatures
    // For now, return a default reference signature path
    const referencePath = path.join(
      this.aiScriptsPath,
      'Signature-Recognition-with-SiameseNetwork-and-CycleGAN',
      'data',
      '04_066.png'
    );

    return fs.existsSync(referencePath) ? referencePath : null;
  }

  /**
   * Save processed results to temp directory
   */
  async saveProcessingResults(results, fileName = null) {
    const filename = fileName || `ai_results_${Date.now()}.json`;
    const filePath = path.join(this.tempDir, filename);
    
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    return filePath;
  }
}

export default AIService;
