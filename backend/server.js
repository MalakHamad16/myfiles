// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

dotenv.config();
const app = express();

// Middlewares عامة
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات الثابتة
app.use(express.static(path.join(__dirname, '../')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// إعداد multer لرفع الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes for complaints
const complaintRoutes = require('./api/complaints');
app.use('/api/complaints', complaintRoutes);
// Routes for zakat
const zakatRoutes = require('./api/zakat');
app.use('/api/zakat', zakatRoutes);

//Routes for auth
const authRoutes = require('./api/authRoutes');
app.use('/api/auth', authRoutes);

//Routes for users
const userRoutes = require('./api/userRoutes');
app.use('/api/users', userRoutes);

//Routes for donation requests
const donationRequestRoutes = require('./api/donationRequestRoutes');
app.use('/api/donation-requests', donationRequestRoutes);

// Routes for approved sponsorships
const sponsorshipRoutes = require('./api/sponsorshipRoutes');
app.use('/api/sponsorships', sponsorshipRoutes);
//sponsor pictures
app.use('/public/sponsor', express.static(path.join(__dirname, '../public/sponsor')));
//Routes for donation payments
const donationPaymentRoutes = require('./api/donationPaymentRoutes');
app.use('/api/donation-payments', donationPaymentRoutes);

// ✅ routes الحملات مع دعم الصور في POST و PUT
const campaignController = require('./controllers/campaignController');
app.get('/api/campaigns', campaignController.getAllCampaigns);
app.get('/api/campaigns/:id', campaignController.getCampaignById);
app.post('/api/campaigns', upload.single('image'), campaignController.createCampaign);
app.put('/api/campaigns/:id', upload.single('image'), campaignController.updateCampaign); // ✅ مضاف
app.delete('/api/campaigns/:id', campaignController.deleteCampaign);

// الاتصال بقاعدة البيانات
mongoose.connect('mongodb://localhost:27017/givehope', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'))
  .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

// تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
