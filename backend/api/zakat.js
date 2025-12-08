// backend/api/zakat.js      

const express = require('express');
const router = express.Router();
const { createZakat, getAllZakat, getZakatById } = require('../controllers/zakatController');

// POST /api/zakat → إنشاء طلب زكاة (للمستخدم العادي)
router.post('/', createZakat);

// GET /api/zakat → جلب جميع الطلبات (للإداري - لاحقًا أضف auth)
router.get('/', getAllZakat);

// GET /api/zakat/:id → جلب طلب واحد (للإداري)
router.get('/:id', getZakatById);

module.exports = router;