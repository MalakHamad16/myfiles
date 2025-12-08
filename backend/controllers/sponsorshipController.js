// backend/controllers/sponsorshipController.js
const Sponsorship = require('../models/Sponsorship');
const DonationRequest = require('../models/DonationRequest');
const User = require('../models/User');

const generateCaseId = async (type) => {
  const prefixMap = {
    orphans: 'ORP',
    educational: 'EDU',
    health: 'HEA',
    living: 'LIV',
    general: 'GEN'
  };
  const prefix = prefixMap[type];
  if (!prefix) throw new Error('Invalid sponsorship type');
  const latest = await Sponsorship.findOne({ caseId: new RegExp(`^${prefix}\\d{3}$`) })
    .sort({ caseId: -1 });
  let nextNumber = 1;
  if (latest) {
    const num = parseInt(latest.caseId.slice(3), 10);
    if (!isNaN(num)) nextNumber = num + 1;
  }
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
};

//  أولوية العجلة — تُستخدم في الترتيب لجميع الحالات
const getUrgencyPriority = (level) => {
  const map = { critical: 1, high: 2, medium: 3, low: 4 };
  return map[level] || 3;
};

exports.createSponsorship = async (req, res) => {
  try {
    const {
      donationRequestId,
      amountPerPeriod,
      periodLabel,
      durationLabel,
      preferredSponsorshipDeadline,
      beneficiaryCount,
      shortDescription,
      totalPeriods
    } = req.body;

    if (!donationRequestId) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد معرّف الطلب (donationRequestId)'
      });
    }

    const request = await DonationRequest.findById(donationRequestId)
      .populate('userId', 'firstName lastName');
    if (!request) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }
    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'لا يمكن إنشاء كفالة إلا من طلب معتمد' });
    }
    if (request.requestType !== 'sponsoring') {
      return res.status(400).json({ success: false, message: 'الطلب ليس من نوع "كفالة"' });
    }
    if (!request.userId) {
      return res.status(400).json({ success: false, message: 'الطلب لا يحتوي على معرف مستخدم مرتبط' });
    }

    // التحقق من المدخلات
    if (amountPerPeriod == null || amountPerPeriod <= 0) return res.status(400).json({ success: false, message: 'المبلغ لكل فترة مطلوب ويجب أن يكون > 0' });
    if (!periodLabel || typeof periodLabel !== 'string' || periodLabel.trim() === '') return res.status(400).json({ success: false, message: 'وصف الفترة مطلوب' });
    if (!durationLabel || typeof durationLabel !== 'string' || durationLabel.trim() === '') return res.status(400).json({ success: false, message: 'وصف المدة مطلوب' });
    if (!preferredSponsorshipDeadline) return res.status(400).json({ success: false, message: 'تاريخ التفضيل مطلوب' });
    const deadline = new Date(preferredSponsorshipDeadline);
    if (isNaN(deadline.getTime())) return res.status(400).json({ success: false, message: 'تاريخ التفضيل غير صالح' });
    if (deadline < new Date()) return res.status(400).json({ success: false, message: 'لا يمكن تحديد تاريخ تفضيل في الماضي' });
    if (!Number.isInteger(beneficiaryCount) || beneficiaryCount < 1) return res.status(400).json({ success: false, message: 'عدد المستفيدين ≥ 1' });
    if (!shortDescription || shortDescription.trim() === '' || shortDescription.length > 500) return res.status(400).json({ success: false, message: 'الوصف المبسط مطلوب (≤500 حرف)' });
    if (totalPeriods == null || !Number.isInteger(totalPeriods) || totalPeriods < 1) return res.status(400).json({ success: false, message: 'عدد الفترات الكلي ≥ 1' });

    const firstName = request.firstName?.trim().split(' ')[0] || 'مجهول';
    const city = request.city?.trim() || '';
    const type = request.dynamicFields?.sponsoringType || 'living';
    const validTypes = ['orphans', 'educational', 'health', 'living', 'general'];
    if (!validTypes.includes(type)) return res.status(400).json({ success: false, message: `نوع الكفالة "${type}" غير مدعوم` });

    const urgencyLevel = request.urgencyLevel || 'medium';
    const caseId = await generateCaseId(type);

    const newSponsorship = await Sponsorship.create({
      caseId,
      firstName,
      city,
      type,
      amountPerPeriod,
      periodLabel,
      durationLabel,
      preferredSponsorshipDeadline: deadline,
      beneficiaryCount,
      shortDescription: shortDescription.trim(),
      urgencyLevel,
      totalPeriods,
      donationRequestId: request._id,
      needyId: request.userId,
      sponsorId: null,
      paidPeriods: 0,
      status: 'not sponsored',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الكفالة بنجاح',
      sponsorship: {
        _id: newSponsorship._id,
        caseId: newSponsorship.caseId,
        firstName: newSponsorship.firstName,
        city: newSponsorship.city,
        type: newSponsorship.type,
        amountPerPeriod: newSponsorship.amountPerPeriod,
        periodLabel: newSponsorship.periodLabel,
        durationLabel: newSponsorship.durationLabel,
        preferredSponsorshipDeadline: newSponsorship.preferredSponsorshipDeadline,
        beneficiaryCount: newSponsorship.beneficiaryCount,
        shortDescription: newSponsorship.shortDescription,
        urgencyLevel: newSponsorship.urgencyLevel,
        totalPeriods: newSponsorship.totalPeriods,
        paidPeriods: newSponsorship.paidPeriods,
        status: newSponsorship.status,
        createdAt: newSponsorship.createdAt
      }
    });
  } catch (error) {
    console.error('Error in createSponsorship:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء الكفالة' });
  }
};

//  getAllSponsorships — الترتيب الكامل كما طلبت
exports.getAllSponsorships = async (req, res) => {
  try {
    let sponsorships = await Sponsorship.find({})
      .select(
        'caseId firstName city type amountPerPeriod periodLabel durationLabel ' +
        'preferredSponsorshipDeadline beneficiaryCount shortDescription ' +
        'urgencyLevel totalPeriods paidPeriods status createdAt'
      );

    // إضافة remainingPeriods
    sponsorships = sponsorships.map(s => ({
      ...s._doc,
      remainingPeriods: Math.max(0, s.totalPeriods - s.paidPeriods)
    }));

    //  الترتيب المطلوب:
    // 1. الحالة: not (1) → partial (2) → full (3)
    // 2. داخل كل حالة: حسب urgencyLevel
    // 3. ثم حسب التاريخ (الأقرب أولًا)
    sponsorships.sort((a, b) => {
      const statusOrder = { 'not sponsored': 1, 'partially sponsored': 2, 'fully sponsored': 3 };
      const sa = statusOrder[a.status], sb = statusOrder[b.status];
      if (sa !== sb) return sa - sb;

      // أولوية العجلة — لجميع الحالات (ليس فقط not sponsored)
      const ua = getUrgencyPriority(a.urgencyLevel);
      const ub = getUrgencyPriority(b.urgencyLevel);
      if (ua !== ub) return ua - ub;

      // التاريخ
      return new Date(a.preferredSponsorshipDeadline) - new Date(b.preferredSponsorshipDeadline);
    });

    res.status(200).json({ success: true, sponsorships });
  } catch (error) {
    console.error('Error in getAllSponsorships:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحميل الكفالات' });
  }
};

exports.getSponsorshipById = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsorship = await Sponsorship.findById(id)
      .select(
        'caseId firstName city type amountPerPeriod periodLabel durationLabel ' +
        'preferredSponsorshipDeadline beneficiaryCount shortDescription ' +
        'urgencyLevel totalPeriods paidPeriods status createdAt'
      );
    if (!sponsorship) return res.status(404).json({ success: false, message: 'الكفالة غير موجودة' });

    const response = {
      ...sponsorship._doc,
      remainingPeriods: Math.max(0, sponsorship.totalPeriods - sponsorship.paidPeriods)
    };
    res.status(200).json({ success: true, sponsorship: response });
  } catch (error) {
    console.error('Error in getSponsorshipById:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحميل تفاصيل الكفالة' });
  }
};