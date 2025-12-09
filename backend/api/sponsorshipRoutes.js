// backend/api/sponsorshipRoutes.js
const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");
const {
  createSponsorship,
  getAllSponsorships,
  getSponsorshipById,
} = require("../controllers/sponsorshipController");

const router = express.Router();

//  Validation rules —  تقليل الحقول المطلوبة من الآدمن
const createSponsorshipValidation = [
  body("donationRequestId")
    .notEmpty()
    .withMessage("معرّف الطلب مطلوب")
    .isMongoId()
    .withMessage("معرّف الطلب يجب أن يكون ObjectId صالح"),
  body("preferredSponsorshipDeadline")
    .notEmpty()
    .withMessage("تاريخ التفضيل (آخر موعد لبدء الكفالة) مطلوب")
    .isISO8601()
    .withMessage("يجب أن يكون تاريخًا صالحًا (صيغة: YYYY-MM-DD)"),
  body("shortDescription")
    .trim()
    .notEmpty()
    .withMessage("الوصف المبسط مطلوب")
    .isLength({ max: 500 })
    .withMessage("الوصف لا يمكن أن يتجاوز 500 حرف"),
];

//  عام: عرض جميع الكفالات
router.get(
  "/",
  (req, res, next) => {
    req.selectFields =
      "caseId firstName city type amountPerPeriod periodLabel durationLabel " +
      "preferredSponsorshipDeadline shortDescription " +
      "urgencyLevel totalPeriods paidPeriods status sponsorId createdAt";
    next();
  },
  getAllSponsorships
);

//  عام: عرض كفالة محددة
router.get(
  "/:id",
  (req, res, next) => {
    req.selectFields =
      "caseId firstName city type amountPerPeriod periodLabel durationLabel " +
      "preferredSponsorshipDeadline shortDescription " +
      "urgencyLevel totalPeriods paidPeriods status sponsorId createdAt";
    next();
  },
  getSponsorshipById
);

//  Admin فقط: إنشاء كفالة
router.post(
  "/",
  protect,
  authorize("admin"),
  createSponsorshipValidation,
  createSponsorship
);

module.exports = router;
