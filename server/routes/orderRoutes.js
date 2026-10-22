const express = require('express');
const router = express.Router();
const {
  initiateCheckout,
  verifyAndCreateOrder,
  createCodOrWalletOrder,
  getCustomerOrders,
  getOrderById,
  trackOrder,
  getVendorOrders,
  updateVendorDeliveryStatus,
  getAdminOrders,
  updateDropshipFulfillment,
  autoDispatchDeoDap,
  getOrderInvoice,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/initiate-checkout', protect, initiateCheckout);
router.post('/verify-and-create', protect, verifyAndCreateOrder);
router.post('/cod-or-wallet-checkout', protect, createCodOrWalletOrder);
router.get('/my-orders', protect, getCustomerOrders);
router.get('/track/:query', trackOrder);
router.get('/vendor/orders', protect, authorize('vendor', 'admin'), getVendorOrders);
router.put('/:orderId/items/:itemId/delivery-status', protect, authorize('vendor', 'admin'), updateVendorDeliveryStatus);
router.put('/:orderId/items/:itemId/dropship-fulfillment', protect, authorize('admin'), updateDropshipFulfillment);
router.post('/:orderId/items/:itemId/auto-dispatch-deodap', protect, authorize('admin'), autoDispatchDeoDap);
router.get('/admin/all', protect, authorize('admin'), getAdminOrders);
router.get('/:id/invoice-preview', getOrderInvoice);
router.get('/:id', protect, getOrderById);

module.exports = router;
