const express = require('express');
const router = express.Router();
const {
  getAllSettlements,
  processSettlement,
  getVendorSettlements,
} = require('../controllers/settlementController');
const { protect, authorize } = require('../middleware/auth');

router.get('/admin', protect, authorize('admin'), getAllSettlements);
router.put('/:id/process', protect, authorize('admin'), processSettlement);
router.get('/vendor/mine', protect, authorize('vendor', 'admin'), getVendorSettlements);

module.exports = router;
