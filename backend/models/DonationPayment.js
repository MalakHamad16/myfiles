const mongoose = require('mongoose');

const donationPaymentSchema = new mongoose.Schema({
  // Reference to donation request
  donationRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationRequest',
    required: [true, 'Donation request reference is required']
  },
  
  // Reference to donatee (the person receiving the donation)
  donatee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Donatee reference is required']
  },
  
  // Donation amount
  donationAmount: {
    type: Number,
    required: [true, 'Donation amount is required'],
    min: [0, 'Donation amount must be positive']
  },
  
  // Donation date
  donationDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Payment status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Payment method (optional)
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'cash', 'other'],
    trim: true
  },
  
  // Transaction ID (optional)
  transactionId: {
    type: String,
    trim: true
  },
  
  // Additional notes
  notes: {
    type: String,
    trim: true
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

// Indexes for faster queries
donationPaymentSchema.index({ donationRequest: 1 });
donationPaymentSchema.index({ donatee: 1 });
donationPaymentSchema.index({ status: 1 });
donationPaymentSchema.index({ donationDate: -1 });
donationPaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DonationPayment', donationPaymentSchema);
