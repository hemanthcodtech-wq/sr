const express = require('express');
const router = express.Router();
const {
  getMyCoupons,
  validateCoupon,
  getReferralStats,
  getAllCouponsAdmin,
  createAdminCoupon,
  toggleCouponStatus,
  deleteAdminCoupon,
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

// Customer / Vendor Public & Protected Routes
router.get('/my-coupons', protect, getMyCoupons);
router.post('/validate', validateCoupon);
router.get('/referral-stats', protect, getReferralStats);

// Admin Coupon Generation & Management Routes
router.get('/admin/all', protect, authorize('admin'), getAllCouponsAdmin);
router.post('/admin/create', protect, authorize('admin'), createAdminCoupon);
router.put('/admin/:id/toggle', protect, authorize('admin'), toggleCouponStatus);
router.delete('/admin/:id', protect, authorize('admin'), deleteAdminCoupon);

module.exports = router;
