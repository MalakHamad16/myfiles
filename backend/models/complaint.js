//backend/models/complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  name: { type: String, required: true },       // الاسم الكامل
  email: { type: String, required: true },      // البريد الإلكتروني
  message: { type: String, required: true },    // نص الشكوى
  createdAt: { type: Date, default: Date.now }  // تاريخ الإرسال تلقائي
});

module.exports = mongoose.model('Complaint', complaintSchema);
