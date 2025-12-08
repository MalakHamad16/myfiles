//backend/controllers/complaintController.js
const Complaint = require('../models/Complaint');
const nodemailer = require('nodemailer');

exports.createComplaint = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // 1️⃣ حفظ الشكوى في MongoDB
    const newComplaint = new Complaint({ name, email, message });
    await newComplaint.save();

    // 2️⃣ إرسال الإيميل 
    // تجريبي ايميل مزيف
    const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'connor.schroeder38@ethereal.email',
        pass: 'VKE6eqJBzRMvBSKpAH'
    }
});


    const mailOptions = {
      from: email,
      to: 'connor.schroeder38@ethereal.email', // بدلاً من Zaka.anb@hotmail.com
      subject: `شكوى جديدة من ${name}`,
      text: `الاسم: ${name}\nالبريد: ${email}\nالرسالة:\n${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('خطأ في إرسال الإيميل:', error);
      } else {
        console.log('تم إرسال الإيميل:', info.response);
      }
    });

    res.status(201).json({ message: 'تم إرسال شكوتك بنجاح!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ، حاول مرة أخرى.' });
  }
};
