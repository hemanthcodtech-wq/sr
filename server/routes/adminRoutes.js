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
  settleVendorWallet,
  getVendorFullDetails,
  getAdminCommissionLedger,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard-stats', protect, authorize('admin'), getDashboardStats);
router.get('/commissions', protect, authorize('admin'), getAdminCommissionLedger);
router.get('/applications', protect, authorize('admin'), getMerchantApplications);
router.put('/applications/:storeId/review', protect, authorize('admin'), reviewMerchantApplication);
router.get('/vendors', protect, authorize('admin'), getAllVendors);
router.get('/vendors/:storeId/full-details', protect, authorize('admin'), getVendorFullDetails);
router.put('/vendors/:storeId/status', protect, authorize('admin'), updateVendorStatus);
router.post('/settle-vendor-wallet', protect, authorize('admin'), settleVendorWallet);
router.get('/settings', protect, authorize('admin'), getPlatformSettings);
router.put('/settings', protect, authorize('admin'), updatePlatformSettings);

module.exports = router;
