const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  getCategories,
  uploadProductImage,
  uploadProductImages,
  scrapeProductPreview,
  getSourcingTemplatesController,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/sourcing-templates', protect, authorize('vendor', 'admin'), getSourcingTemplatesController);
router.get('/vendor/mine', protect, authorize('vendor', 'admin'), getVendorProducts);
router.get('/vendor/my-products', protect, authorize('vendor', 'admin'), getVendorProducts);
router.get('/:id', getProductById);

router.post('/scrape-preview', protect, authorize('vendor', 'admin'), scrapeProductPreview);
router.post('/', protect, authorize('vendor'), createProduct);
router.put('/:id', protect, authorize('vendor', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('vendor', 'admin'), deleteProduct);
router.post('/upload-image', protect, authorize('vendor', 'admin'), upload.single('image'), uploadProductImage);
router.post('/upload-images', protect, authorize('vendor', 'admin'), upload.array('images', 8), uploadProductImages);

module.exports = router;
