const mongoose = require('mongoose');

const donationRequestSchema = new mongoose.Schema({
  // User information (if authenticated)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // Basic Information
  requestType: {
    type: String,
    required: true,
    enum: ['education', 'health', 'living', 'sponsoring', 'emergency', 'other']
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  idNumber: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  
  // Dynamic fields (stored as object to accommodate different request types)
  dynamicFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Additional Information
  additionalNotes: {
    type: String,
    trim: true
  },
  urgencyLevel: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical']
  },
  
  // Documents (store file paths or URLs)
  documents: [{
    name: String,
    path: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Request Status
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'under_review', 'approved', 'rejected', 'completed']
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    trim: true
  },
  
  // Review information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
donationRequestSchema.index({ email: 1 });
donationRequestSchema.index({ idNumber: 1 });
donationRequestSchema.index({ status: 1 });
donationRequestSchema.index({ requestType: 1 });
donationRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DonationRequest', donationRequestSchema);
