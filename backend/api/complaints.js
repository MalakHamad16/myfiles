//backend/api/complaints.js
const express = require('express');
const router = express.Router();
const { createComplaint } = require('../controllers/complaintController');

// استقبال شكوى جديدة
router.post('/', createComplaint);

module.exports = router;
