// backend/controllers/zakatRateController.js
const ZakatRate = require('../models/zakatRate');

// GET /api/zakat/rates → يُعيد أحدث الأسعار
exports.getRates = async (req, res) => {
  try {
    const rate = await ZakatRate.getLatest();
    res.json({
      goldPerGram: rate.goldPerGram,
      silverPerGram: rate.silverPerGram,
      baseCurrency: rate.baseCurrency
    });
  } catch (error) {
    res.status(500).json({ message: 'فشل تحميل أسعار الزكاة' });
  }
};

// (اختياري) POST /api/zakat/rates → لتحديث الأسعار (للإداري فقط)
exports.updateRates = async (req, res) => {
  try {
    const { goldPerGram, silverPerGram, baseCurrency } = req.body;
    let rate = await ZakatRate.findOne();
    if (!rate) {
      rate = new ZakatRate({ goldPerGram, silverPerGram, baseCurrency });
    } else {
      rate.goldPerGram = goldPerGram;
      rate.silverPerGram = silverPerGram;
      rate.baseCurrency = baseCurrency;
      rate.updatedAt = new Date();
    }
    await rate.save();
    res.json(rate);
  } catch (error) {
    res.status(500).json({ message: 'فشل تحديث الأسعار' });
  }
};