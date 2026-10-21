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
router.get('/my-store', protect, authorize('vendor', 'admin'), getVendorStore);
router.put('/my-store', protect, authorize('vendor', 'admin'), updateStore);
router.get('/wallet', protect, authorize('vendor', 'admin'), getWalletAndReferrals);
router.post('/request-payout', protect, authorize('vendor'), requestPayout);

module.exports = router;
