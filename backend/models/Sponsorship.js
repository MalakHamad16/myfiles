// backend/models/Sponsorship.js
const mongoose = require('mongoose');

const sponsorshipSchema = new mongoose.Schema({
  // 1. معرّف فريد خارجي (مرئي في الفرونت)
  caseId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[A-Z]{3}\d{3}$/
  },
  // 2. بيانات من طلب الدعم (بعد الموافقة)    
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    required: true,
    enum: ['orphans', 'educational', 'health', 'living', 'general'],
    default: 'general'
  },
  amountPerPeriod: {
    type: Number,
    required: true,
    min: 1
  },
  periodLabel: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  durationLabel: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  totalPeriods: {
    type: Number,
    required: true,
    min: 1,
    comment: "عدد الفترات الكلي (مثال: 12 = 12 شهرًا، 3 = 3 فصول دراسية)"
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  // 3. بيانات يدخلها الـ Admin فقط
  shortDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  preferredSponsorshipDeadline: {
    type: Date,
    required: true
  },
  // 4. روابط داخلية
  donationRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationRequest',
    required: true
  },
  needyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // 5. حالة الدفع
  paidPeriods: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['not sponsored', 'partially sponsored', 'fully sponsored'],
    default: 'not sponsored'
  },
  // 6. تتبع
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// فهارس
sponsorshipSchema.index({ status: 1 });
sponsorshipSchema.index({ type: 1 });
sponsorshipSchema.index({ urgencyLevel: 1 });
sponsorshipSchema.index({ preferredSponsorshipDeadline: 1 });
sponsorshipSchema.index({ needyId: 1 });
sponsorshipSchema.index({ sponsorId: 1 });

module.exports = mongoose.model('Sponsorship', sponsorshipSchema);