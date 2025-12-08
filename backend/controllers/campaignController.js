// backend/controllers/campaignController.js
const Campaign = require('../models/Campaign');
const fs = require('fs');
const path = require('path');

// دالة مساعدة لتحديث الحالة تلقائيًا
const updateCampaignStatus = async (campaign) => {
  const now = new Date();
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  const isCompleted = campaign.collectedAmount >= campaign.goalAmount;

  // إذا كانت معلقة يدويًا، لا تغيّر حالتها
  if (campaign.status === 'pending') return campaign.status;

  if (start > now) {
    return 'scheduled';
  } else if (end < now) {
    return isCompleted ? 'completed' : 'ended';
  } else {
    return isCompleted ? 'completed' : 'active';
  }
};

// جلب جميع الحملات مع تحديث الحالة تلقائيًا
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find();

    // تحديث الحالات ديناميكيًا وحفظها في قاعدة البيانات
    const updatedCampaigns = await Promise.all(
      campaigns.map(async (camp) => {
        const currentStatus = camp.status;
        const newStatus = await updateCampaignStatus(camp);

        if (currentStatus !== newStatus && currentStatus !== 'pending') {
          camp.status = newStatus;
          await camp.save();
        }
        return camp;
      })
    );

    res.status(200).json(updatedCampaigns);
  } catch (error) {
    console.error('Error in getAllCampaigns:', error);
    res.status(500).json({ message: 'خطأ في جلب الحملات', error: error.message });
  }
};

// جلب حملة واحدة
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'الحملة غير موجودة' });
    }
    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب تفاصيل الحملة', error: error.message });
  }
};

// إنشاء حملة جديدة
exports.createCampaign = async (req, res) => {
  try {
    const { title, description, goalAmount, startDate, endDate, currency } = req.body;
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const today = new Date();
    const start = new Date(startDate);
    const status = start <= today ? 'active' : 'scheduled';

    const campaign = new Campaign({
      title,
      description,
      goalAmount: parseFloat(goalAmount),
      collectedAmount: 0,
      startDate: start,
      endDate: new Date(endDate),
      image: imageUrl,
      currency: currency || 'ILS'.trim(),
      status
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error in createCampaign:', error);
    res.status(500).json({ message: 'فشل إنشاء الحملة', error: error.message });
  }
};

// تعديل حملة
exports.updateCampaign = async (req, res) => {
  try {
    const { title, description, goalAmount, startDate, endDate, currency } = req.body;
    const isPending = req.body.status === 'pending';

    const updateData = {
      title,
      description,
      goalAmount: parseFloat(goalAmount),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      currency: currency || 'ILS'.trim(),
    };

    // السماح فقط بوضع "pending" يدويًا، أما باقي الحالات فتُحدّث تلقائيًا لاحقًا
    if (isPending) {
      updateData.status = 'pending';
    }

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({ message: 'الحملة غير موجودة' });
    }

    res.status(200).json(campaign);
  } catch (error) {
    console.error('Error in updateCampaign:', error);
    res.status(500).json({ message: 'فشل تعديل الحملة', error: error.message });
  }
};

// حذف حملة
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'الحملة غير موجودة' });
    }

    if (campaign.image) {
      const imagePath = path.join(__dirname, '..', '..', 'public', campaign.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({ message: 'تم حذف الحملة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'فشل حذف الحملة', error: error.message });
  }
};