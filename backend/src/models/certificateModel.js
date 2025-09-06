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
    required: true 
  },
  rollNumber: { 
    type: String, 
    required: true 
  },
  institution: { 
    type: String, 
    required: true 
  },
  course: { 
    type: String, 
    required: true 
  },
  grade: { 
    type: String, 
    required: true 
  },
  issueDate: { 
    type: Date, 
    required: true 
  },
  
  // File storage
  image: String, // base64 or URL for original image
  filePath: String, // path to uploaded file
  watermarkedPath: String, // path to watermarked file
  
  // Blockchain integration
  blockchainHash: { 
    type: String, 
    required: true,
    index: true 
  },
  transactionHash: { 
    type: String, 
    required: true 
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