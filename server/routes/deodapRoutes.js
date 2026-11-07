const express = require('express');
const router = express.Router();
const {
  getDeoDapStatsController,
  syncDeoDapCatalogController,
  updateProfitMarginController,
  previewDeoDapProducts,
  uploadDeoDapCsvController,
} = require('../controllers/deodapController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/stats', protect, authorize('admin'), getDeoDapStatsController);
router.post('/sync', protect, authorize('admin'), syncDeoDapCatalogController);
router.post('/upload-csv', protect, authorize('admin'), upload.single('file'), uploadDeoDapCsvController);
router.put('/profit-margin', protect, authorize('admin'), updateProfitMarginController);
router.get('/preview', protect, authorize('admin'), previewDeoDapProducts);

module.exports = router;

