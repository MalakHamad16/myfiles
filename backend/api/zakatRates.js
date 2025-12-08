// backend/api/zakatRates.js
const express = require('express');
const router = express.Router();
const { getRates, updateRates } = require('../controllers/zakatRateController');

router.get('/rates', getRates);
// router.post('/rates', /* auth, adminOnly, */ updateRates); // ممكن تفعيله لاحقًا

module.exports = router;