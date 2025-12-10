// backend/controllers/campaignController.js
const Campaign = require("../models/Campaign");
const fs = require("fs");
const path = require("path");

// دالة مساعدة لتحديث الحالة تلقائيًا
const updateCampaignStatus = async (campaign) => {
  const now = new Date();
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  const isCompleted = campaign.collectedAmount >= campaign.goalAmount;

  // إذا كانت معلقة يدويًا، لا تغيّر حالتها
  if (campaign.status === "pending") return campaign.status;

  if (start > now) {
    return "scheduled";
  } else if (end < now) {
    return isCompleted ? "completed" : "ended";
  } else {
    return isCompleted ? "completed" : "active";
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

      // ✅ الإشعارات هنا — داخل الحلقة، بعد حفظ الحملة
      try {
        // 1. تفعيل حملة مجدولة → نشطة
        if (currentStatus === 'scheduled' && newStatus === 'active') {
          await NotificationService.createNotification({
            user: 'admin',
            title: '🎉 تم تفعيل حملة مجدولة',
            message: `الحملة "${camp.title}" (رقم: ${camp._id.substring(0, 6)}) أصبحت الآن **نشطة** وتستقبل التبرعات.`,
            type: 'campaign_activated',
            channels: ['dashboard', 'push', 'email'],
            referenceId: camp._id,
            link: `/campaigns.html#campaign-${camp._id}`,
            metadata: {
              campaignId: camp._id,
              campaignTitle: camp.title,
              activatedAt: new Date()
            }
          });
          console.log(`🔔 إشعار: تفعيل الحملة ${camp.title}`);
        }

        // 2. اكتمال الحملة
        else if (currentStatus !== 'completed' && newStatus === 'completed') {
          await NotificationService.createNotification({
            user: 'admin',
            title: '🌟 اكتملت حملة بنجاح!',
            message: `الحملة "${camp.title}" (رقم: ${camp._id.substring(0, 6)}) **اكتملت بالكامل**، وتم جمع ${camp.collectedAmount.toLocaleString()} ${camp.currency} من أصل ${camp.goalAmount.toLocaleString()} ${camp.currency}.`,
            type: 'campaign_completed',
            channels: ['dashboard', 'push', 'email'],
            referenceId: camp._id,
            link: `/campaigns.html#campaign-${camp._id}`,
            metadata: {
              campaignId: camp._id,
              campaignTitle: camp.title,
              goalAmount: camp.goalAmount,
              collectedAmount: camp.collectedAmount,
              currency: camp.currency,
              completedAt: new Date()
            }
          });
          console.log(`✅ إشعار: اكتمال الحملة ${camp.title}`);
        }

        // 3. انتهاء الحملة دون اكتمال
        else if (currentStatus !== 'ended' && newStatus === 'ended') {
          const collectedRatio = ((camp.collectedAmount / camp.goalAmount) * 100).toFixed(1);
          await NotificationService.createNotification({
            user: 'admin',
            title: '⚠️ انتهت حملة دون اكتمال',
            message: `الحملة "${camp.title}" (رقم: ${camp._id.substring(0, 6)}) **انتهت** دون بلوغ الهدف. تم جمع ${camp.collectedAmount.toLocaleString()} ${camp.currency} فقط (${collectedRatio}%) من أصل ${camp.goalAmount.toLocaleString()} ${camp.currency}.`,
            type: 'campaign_ended',
            channels: ['dashboard', 'email'],
            referenceId: camp._id,
            link: `/campaigns.html#campaign-${camp._id}`,
            metadata: {
              campaignId: camp._id,
              campaignTitle: camp.title,
              goalAmount: camp.goalAmount,
              collectedAmount: camp.collectedAmount,
              currency: camp.currency,
              endedAt: new Date()
            }
          });
          console.log(`⏹️ إشعار: انتهاء الحملة ${camp.title} دون اكتمال`);
        }

      } catch (err) {
        console.warn(`⚠️ فشل إرسال إشعار الحملة ${camp.title}:`, err.message);
        // لا نُلغي التحديث بسبب فشل الإشعار — لا نريد كسر النظام
      }
    }
    return camp;
  })
);
    //******************************************************* */

    res.status(200).json(updatedCampaigns);
  } catch (error) {
    console.error("Error in getAllCampaigns:", error);
    res
      .status(500)
      .json({ message: "خطأ في جلب الحملات", error: error.message });
  }
};

// جلب حملة واحدة
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "الحملة غير موجودة" });
    }
    res.status(200).json(campaign);
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطأ في جلب تفاصيل الحملة", error: error.message });
  }
};

// إنشاء حملة جديدة
exports.createCampaign = async (req, res) => {
  try {
    const { title, description, goalAmount, startDate, endDate, currency } =
      req.body;
    let imageUrl = "";
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const today = new Date();
    const start = new Date(startDate);
    const status = start <= today ? "active" : "scheduled";

    const campaign = new Campaign({
      title,
      description,
      goalAmount: parseFloat(goalAmount),
      collectedAmount: 0,
      startDate: start,
      endDate: new Date(endDate),
      image: imageUrl,
      currency: currency || "ILS".trim(),
      status,
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    console.error("Error in createCampaign:", error);
    res.status(500).json({ message: "فشل إنشاء الحملة", error: error.message });
  }
};

// تعديل حملة
exports.updateCampaign = async (req, res) => {
  try {
    const { title, description, goalAmount, startDate, endDate, currency } =
      req.body;
    const isPending = req.body.status === "pending";

    const updateData = {
      title,
      description,
      goalAmount: parseFloat(goalAmount),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      currency: currency || "ILS".trim(),
    };

    // السماح فقط بوضع "pending" يدويًا، أما باقي الحالات فتُحدّث تلقائيًا لاحقًا
    if (isPending) {
      updateData.status = "pending";
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
      return res.status(404).json({ message: "الحملة غير موجودة" });
    }

    res.status(200).json(campaign);
  } catch (error) {
    console.error("Error in updateCampaign:", error);
    res.status(500).json({ message: "فشل تعديل الحملة", error: error.message });
  }
};

// حذف حملة
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "الحملة غير موجودة" });
    }

    if (campaign.image) {
      const imagePath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        campaign.image
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({ message: "تم حذف الحملة بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "فشل حذف الحملة", error: error.message });
  }
};
