// backend/models/zakat.js
const mongoose = require('mongoose');

const zakatSchema = new mongoose.Schema({
  userId: { 
    //type: mongoose.Schema.Types.ObjectId, 
    //ref: 'User', 
    type: String,   // ←  إلى String مؤقتًا
    required: false // اختياري مؤقتًا حتى يُجهّز  نظام المستخدم
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  calculatedAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['credit_card', 'bank_transfer', 'cash', 'other']
  },
  currency: {
    type: String,
    enum: ['ILS', 'USD', 'JOD', 'AED'],
    default: 'ILS'
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('zakat', zakatSchema);