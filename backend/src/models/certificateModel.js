import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  // Basic certificate information
  certificateId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  studentName: { 
    type: String, 
    required: false,
    default: 'Not Provided'
  },
  rollNumber: { 
    type: String, 
    required: false,
    default: 'N/A'
  },
  studentEmail: {
    type: String,
    required: false,
    default: null
  },
  institution: { 
    type: String, 
    required: false,
    default: 'Unknown Institution'
  },
  institutionName: { 
    type: String, 
    required: false,
    default: 'Unknown Institution'
  },
  course: { 
    type: String, 
    required: false,
    default: 'Not Specified'
  },
  courseName: { 
    type: String, 
    required: false,
    default: 'Not Specified'
  },
  grade: { 
    type: String, 
    required: false,
    default: 'Pass'
  },
  issueDate: { 
    type: Date, 
    required: false,
    default: Date.now
  },
  
  // Additional fields used by service
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: {
    type: Date,
    default: Date.now
  },
  watermarkData: {
    type: mongoose.Schema.Types.Mixed
  },
  institutionId: {
    type: String,
    required: false
  },
  metadata: {
    originalFileName: String,
    fileSize: Number,
    uploadedAt: Date,
    hasFile: Boolean
  },
  
  // File storage
  image: String, // base64 or URL for original image
  filePath: String, // path to uploaded file
  watermarkedPath: String, // path to watermarked file
  certificateImagePath: String, // path to certificate image/PDF
  certificateImage: String, // base64 encoded certificate image/PDF
  
  // Signature verification
  signatureData: {
    extractedSignatures: [String], // paths to extracted signature crops
    signatureVerificationResults: [{
      signatureIndex: Number,
      confidenceScore: Number,
      isMatch: Boolean,
      verificationStatus: String,
      bbox: {
        x1: Number,
        y1: Number,
        x2: Number,
        y2: Number
      }
    }],
    overallSignatureMatch: Boolean,
    highestConfidenceScore: Number,
    signatureVerificationDate: Date
  },
  
  // Blockchain integration
  blockchainHash: { 
    type: String, 
    required: false,
    index: true 
  },
  transactionHash: { 
    type: String, 
    required: false 
  },
  documentHash: { 
    type: String, 
    required: true,
    index: true 
  },
  blockNumber: Number,
  
  // Verification status
  verificationStatus: { 
    type: String, 
    enum: ['verified', 'pending', 'blacklisted', 'invalid'], 
    default: 'verified' 
  },
  isBlacklisted: { 
    type: Boolean, 
    default: false 
  },
  blacklistReason: String,
  blacklistedAt: Date,
  
  // Timestamps
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  },
  verifiedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // Additional metadata
  fileSize: Number,
  mimeType: String,
  
  // AI/OCR extracted data (if applicable)
  extractedData: {
    text: String,
    confidence: Number,
    fields: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

// Indexes for better query performance
certificateSchema.index({ certificateId: 1, documentHash: 1 });
certificateSchema.index({ institution: 1, verificationStatus: 1 });
certificateSchema.index({ studentName: 1, rollNumber: 1 });
certificateSchema.index({ blockchainHash: 1 });

// Methods
certificateSchema.methods.blacklist = function(reason) {
  this.isBlacklisted = true;
  this.verificationStatus = 'blacklisted';
  this.blacklistReason = reason;
  this.blacklistedAt = new Date();
  return this.save();
};

certificateSchema.methods.verify = function() {
  this.verificationStatus = 'verified';
  this.verifiedAt = new Date();
  return this.save();
};

// Static methods
certificateSchema.statics.findByCertificateId = function(certId) {
  return this.findOne({ certificateId: certId });
};

certificateSchema.statics.findByBlockchainHash = function(hash) {
  return this.findOne({ blockchainHash: hash });
};

certificateSchema.statics.findByInstitution = function(institution) {
  return this.find({ institution: institution, verificationStatus: 'verified' });
};

const Certificate = mongoose.model("Certificate", certificateSchema);
export default Certificate;