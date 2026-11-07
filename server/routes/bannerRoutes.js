const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  toggleBannerActive,
  deleteBanner,
} = require('../controllers/bannerController');

// Public route to fetch active banners for homepage hero carousel
router.get('/', getActiveBanners);

// Admin-only management routes
router.get('/admin', protect, authorize('admin'), getAllBannersAdmin);
router.post('/', protect, authorize('admin'), upload.single('image'), createBanner);
router.put('/:id', protect, authorize('admin'), upload.single('image'), updateBanner);
router.patch('/:id/toggle', protect, authorize('admin'), toggleBannerActive);
router.delete('/:id', protect, authorize('admin'), deleteBanner);

module.exports = router;

