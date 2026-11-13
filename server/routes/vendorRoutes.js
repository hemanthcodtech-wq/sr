const express = require('express');
const router = express.Router();
const {
  initiatePlanPayment,
  registerStoreWithPlan,
  getVendorStore,
  updateStore,
  getWalletAndReferrals,
  requestPayout,
  submitMerchantApplication,
  getEnrollmentStatus,
  initiateEnrollmentPayment,
  verifyEnrollmentPayment,
  getPublicStores,
  getPublicStoreByIdOrSlug,
  renewPlanSubscription,
  getVendorAnalytics,
  getDropshipPromotions,
  getMyPromotionStats,
  requestCatalogAccess,
  getAdminCatalogForVendors,
  sourceAdminProduct,
} = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/auth');

// Public Storefront Endpoints
router.get('/public-stores', getPublicStores);
router.get('/public-stores/:idOrSlug', getPublicStoreByIdOrSlug);

router.post('/submit-application', protect, submitMerchantApplication);
router.get('/enrollment-status', protect, getEnrollmentStatus);
router.post('/initiate-enrollment-payment', protect, initiateEnrollmentPayment);
router.post('/verify-enrollment-payment', protect, verifyEnrollmentPayment);
router.post('/initiate-plan-payment', protect, initiatePlanPayment);
router.post('/register-store', protect, registerStoreWithPlan);
router.post('/renew-plan', protect, authorize('vendor', 'admin'), renewPlanSubscription);
router.get('/my-store', protect, authorize('vendor', 'admin'), getVendorStore);
router.put('/my-store', protect, authorize('vendor', 'admin'), updateStore);
router.get('/analytics', protect, authorize('vendor', 'admin'), getVendorAnalytics);
router.get('/wallet', protect, authorize('vendor', 'admin'), getWalletAndReferrals);
router.post('/request-payout', protect, authorize('vendor'), requestPayout);

// Vendor Admin Catalog Sourcing
router.post('/request-catalog-access', protect, authorize('vendor', 'admin'), requestCatalogAccess);
router.get('/admin-catalog', protect, authorize('vendor', 'admin'), getAdminCatalogForVendors);
router.post('/source-admin-product', protect, authorize('vendor', 'admin'), sourceAdminProduct);

// Vendor Dropship Affiliate Promotions (50/50 profit margin split)
router.get('/dropship-promotions', protect, authorize('vendor', 'admin'), getDropshipPromotions);
router.get('/my-promotions-stats', protect, authorize('vendor', 'admin'), getMyPromotionStats);

module.exports = router;
