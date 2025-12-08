// backend/models/Campaign.js
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  goalAmount: { type: Number, required: true },
  collectedAmount: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  image: { type: String },
  currency: {
    type: String,
    enum: ['ILS', 'USD', 'JOD', 'AED'],
    default: 'ILS'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'pending', 'ended', 'scheduled'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);