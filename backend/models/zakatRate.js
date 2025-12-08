// backend/models/zakatRate.js
const mongoose = require('mongoose');

const zakatRateSchema = new mongoose.Schema({
  goldPerGram: { type: Number, required: true },
  silverPerGram: { type: Number, required: true },
  baseCurrency: { type: String, enum: ['ILS', 'USD', 'JOD', 'AED'], default: 'ILS' },
  updatedAt: { type: Date, default: Date.now }
});

// نضمن وجود سجل واحد فقط (Singleton)
zakatRateSchema.statics.getLatest = async function () {
  let rate = await this.findOne();
  if (!rate) {
    // إنشاء سجل افتراضي أول مرة
    rate = await this.create({
      goldPerGram: 300,
      silverPerGram: 4,
      baseCurrency: 'ILS'
    });
  }
  return rate;
};

module.exports = mongoose.model('zakatRate', zakatRateSchema);