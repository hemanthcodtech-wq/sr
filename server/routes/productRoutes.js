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
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/vendor/mine', protect, authorize('vendor', 'admin'), getVendorProducts);
router.get('/:id', getProductById);

router.post('/', protect, authorize('vendor', 'admin'), createProduct);
router.put('/:id', protect, authorize('vendor', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('vendor', 'admin'), deleteProduct);
router.post('/upload-image', protect, authorize('vendor', 'admin'), upload.single('image'), uploadProductImage);

module.exports = router;
