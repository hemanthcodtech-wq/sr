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
  updateVendorCatalogAccess,
  deleteVendorStore,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { runPlanExpirySweeper } = require('../services/planSweeperService');

router.get('/dashboard-stats', protect, authorize('admin'), getDashboardStats);
router.get('/commissions', protect, authorize('admin'), getAdminCommissionLedger);
router.get('/applications', protect, authorize('admin'), getMerchantApplications);
router.put('/applications/:storeId/review', protect, authorize('admin'), reviewMerchantApplication);
router.get('/vendors', protect, authorize('admin'), getAllVendors);
router.get('/vendors/:storeId/full-details', protect, authorize('admin'), getVendorFullDetails);
router.put('/vendors/:storeId/status', protect, authorize('admin'), updateVendorStatus);
router.put('/vendors/:storeId/catalog-access', protect, authorize('admin'), updateVendorCatalogAccess);
router.delete('/vendors/:storeId', protect, authorize('admin'), deleteVendorStore);
router.post('/settle-vendor-wallet', protect, authorize('admin'), settleVendorWallet);
router.get('/settings', protect, authorize('admin'), getPlatformSettings);
router.put('/settings', protect, authorize('admin'), updatePlatformSettings);
router.post('/run-expiry-sweeper', protect, authorize('admin'), async (req, res, next) => {
  try {
    const results = await runPlanExpirySweeper();
    res.status(200).json({ success: true, message: 'Expiry sweeper executed successfully', results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
