const express = require('express');
const router = express.Router();
const {
  getDeoDapStatsController,
  syncDeoDapCatalogController,
  updateProfitMarginController,
  previewDeoDapProducts,
} = require('../controllers/deodapController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), getDeoDapStatsController);
router.post('/sync', protect, authorize('admin'), syncDeoDapCatalogController);
router.put('/profit-margin', protect, authorize('admin'), updateProfitMarginController);
router.get('/preview', protect, authorize('admin'), previewDeoDapProducts);

module.exports = router;

