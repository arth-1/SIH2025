import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import Certificate from '../models/certificateModel.js';

export class SignatureVerificationService {
  
  async verifySignature(uploadedCertPath, studentId, rollNumber, certificateId) {
    try {
      const existingCert = await Certificate.findOne({
        $or: [
          { rollNumber: rollNumber },
          { certificateId: certificateId }
        ]
      }).sort({ createdAt: -1 });

      if (!existingCert || !existingCert.certificateImagePath) {
        return {
          success: false,
          error: 'No existing certificate found in database for comparison'
        };
      }

      if (!fs.existsSync(existingCert.certificateImagePath)) {
        return {
          success: false,
          error: 'Stored certificate image file not found'
        };
      }

      const signatureResults = await this.runSignaturePipeline(
        uploadedCertPath,
        existingCert.certificateImagePath
      );

      const verificationResult = this.processSignatureResults(signatureResults);

      await this.updateCertificateWithSignatureData(existingCert._id, verificationResult);

      return {
        success: true,
        signatureVerification: verificationResult,
        existingCertificateId: existingCert.certificateId,
        comparedWith: existingCert.certificateImagePath
      };

    } catch (error) {
      console.error('Signature verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runSignaturePipeline(uploadedCertPath, storedCertPath) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'ai', 'Signature-Recognition-with-SiameseNetwork-and-CycleGAN', 'pipeline_yolo_to_signet.py');
      const yoloModelPath = path.join(process.cwd(), 'ai', 'Signature-Recognition-with-SiameseNetwork-and-CycleGAN', 'yolov8s.pt');
      
      // Use the Python executable from the virtual environment
      const pythonExec = process.platform === 'win32' 
        ? path.join(process.cwd(), '..', '.venv', 'Scripts', 'python.exe')
        : path.join(process.cwd(), '..', '.venv', 'bin', 'python');
      
      const pythonProcess = spawn(pythonExec, [
        scriptPath,
        '--certificate-path', uploadedCertPath,
        '--anchor-path', storedCertPath,
        '--yolo-model', yoloModelPath,
        '--output-format', 'json'
      ], {
        cwd: path.dirname(scriptPath)
      });

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Python stdout:', output);
        outputData += output;
      });

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.log('Python stderr:', error);
        errorData += error;
      });

      pythonProcess.on('close', (code) => {
        console.log(`Python process closed with code: ${code}`);
        console.log('Python output:', outputData);
        console.log('Python errors:', errorData);
        
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${errorData}`));
          return;
        }

        try {
          // Extract JSON from the output by finding the JSON array part
          let jsonData = outputData.trim();
          
          // Look for the JSON array in the output (starts with [ and ends with ])
          const jsonStart = jsonData.lastIndexOf('[');
          const jsonEnd = jsonData.lastIndexOf(']') + 1;
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
            jsonData = jsonData.substring(jsonStart, jsonEnd);
          }
          
          const result = JSON.parse(jsonData);
          resolve(result);
        } catch (parseError) {
          console.error('Raw Python output:', outputData);
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      });
    });
  }

  processSignatureResults(rawResults) {
    if (!Array.isArray(rawResults) || rawResults.length === 0) {
      return {
        overallMatch: false,
        highestConfidenceScore: 0,
        signatureCount: 0,
        verificationStatus: 'no_signatures_found',
        signatureResults: []
      };
    }

    let highestScore = 0;
    let matchingSignatures = 0;
    const threshold = parseFloat(process.env.SIGNATURE_THRESHOLD || '0.5');

    const processedResults = rawResults.map(result => {
      // The result.score is already a confidence score (0-1)
      const confidenceScore = result.score;
      const isMatch = result.label.toLowerCase() !== 'forged' && confidenceScore >= threshold;
      
      if (confidenceScore > highestScore) {
        highestScore = confidenceScore;
      }
      
      if (isMatch) {
        matchingSignatures++;
      }

      return {
        signatureIndex: result.index,
        confidenceScore: Math.round(confidenceScore * 100) / 100,
        isMatch: isMatch,
        verificationStatus: result.label.toLowerCase(),
        bbox: result.bbox,
        cropPath: result.crop_path
      };
    });

    const overallMatch = matchingSignatures > 0;

    return {
      overallMatch: overallMatch,
      highestConfidenceScore: Math.round(highestScore * 100) / 100,
      signatureCount: rawResults.length,
      matchingSignatures: matchingSignatures,
      verificationStatus: overallMatch ? 'verified' : 'failed',
      signatureResults: processedResults,
      verificationDate: new Date()
    };
  }

  async updateCertificateWithSignatureData(certificateId, signatureVerification) {
    try {
      await Certificate.findByIdAndUpdate(certificateId, {
        $set: {
          'signatureData.signatureVerificationResults': signatureVerification.signatureResults,
          'signatureData.overallSignatureMatch': signatureVerification.overallMatch,
          'signatureData.highestConfidenceScore': signatureVerification.highestConfidenceScore,
          'signatureData.signatureVerificationDate': signatureVerification.verificationDate
        }
      });
    } catch (error) {
      console.error('Error updating certificate with signature data:', error);
    }
  }

  async saveCertificateImage(fileBuffer, certificateId, originalFileName) {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileExt = path.extname(originalFileName) || '.pdf';
      const fileName = `${certificateId}_${Date.now()}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, fileBuffer);

      return {
        success: true,
        filePath: filePath,
        relativePath: path.join('uploads', 'certificates', fileName)
      };
    } catch (error) {
      console.error('Error saving certificate image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const signatureVerificationService = new SignatureVerificationService();
export default signatureVerificationService;