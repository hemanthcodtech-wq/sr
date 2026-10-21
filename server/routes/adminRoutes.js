const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllVendors,
  updateVendorStatus,
  getPlatformSettings,
  updatePlatformSettings,
  getMerchantApplications,
  reviewMerchantApplication,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard-stats', protect, authorize('admin'), getDashboardStats);
router.get('/applications', protect, authorize('admin'), getMerchantApplications);
router.put('/applications/:storeId/review', protect, authorize('admin'), reviewMerchantApplication);
router.get('/vendors', protect, authorize('admin'), getAllVendors);
router.put('/vendors/:storeId/status', protect, authorize('admin'), updateVendorStatus);
router.get('/settings', protect, authorize('admin'), getPlatformSettings);
router.put('/settings', protect, authorize('admin'), updatePlatformSettings);

module.exports = router;
