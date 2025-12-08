// backend/controllers/zakatController.js
const Zakat = require('../models/zakat');

// إنشاء طلب زكاة جديد
exports.createZakat = async (req, res) => {
  try {
    const { amount, calculatedAmount, paymentMethod, currency, userId } = req.body;

    const zakat = new Zakat({
      amount: parseFloat(amount),
      calculatedAmount: parseFloat(calculatedAmount),
      paymentMethod,
      currency: currency || 'ILS',
      userId: userId || null // مؤقتًا
    });

    await zakat.save();
    res.status(201).json(zakat);
  } catch (error) {
    console.error('خطأ في إنشاء طلب الزكاة:', error);
    res.status(500).json({ 
      message: 'فشل إنشاء طلب الزكاة', 
      error: error.message 
    });
  }
};

// جلب جميع طلبات الزكاة (للإداري لاحقًا)
exports.getAllZakat = async (req, res) => {
  try {
    const zakatRequests = await Zakat.find().populate('userId', 'email');
    res.status(200).json(zakatRequests);
  } catch (error) {
    res.status(500).json({ message: 'فشل جلب طلبات الزكاة', error: error.message });
  }
};

// جلب طلب واحد (للإداري)
exports.getZakatById = async (req, res) => {
  try {
    const zakat = await Zakat.findById(req.params.id).populate('userId', 'email');
    if (!zakat) {
      return res.status(404).json({ message: 'طلب الزكاة غير موجود' });
    }
    res.status(200).json(zakat);
  } catch (error) {
    res.status(500).json({ message: 'فشل جلب طلب الزكاة', error: error.message });
  }
};