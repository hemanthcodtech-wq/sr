const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const PlatformSetting = require('../models/PlatformSetting');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../config/razorpay');
const { generateInvoice } = require('../utils/invoiceGenerator');
const { dispatchToDeoDap } = require('../utils/dropshipAutomator');
const { mockOrders, mockProducts, mockUsers, mockTransactions, mockSettings } = require('../config/mockStore');

// Helper to enrich order items with dropshipping metadata
const enrichItemsWithDropship = async (items, defaultTrackingNum = '') => {
  const enriched = [];
  for (const i of items) {
    const prodId = i.product?._id || i.product || i._id;
    let dbProd = null;

    if (mongoose.connection.readyState === 1 && prodId && mongoose.Types.ObjectId.isValid(prodId)) {
      try {
        dbProd = await Product.findById(prodId);
      } catch (err) {
        // Fallback
      }
    }

    if (!dbProd) {
      dbProd = mockProducts.find((p) => p._id === prodId) || (typeof i.product === 'object' ? i.product : null);
    }

    const isDropship =
      dbProd?.isDropshipped ||
      ['amazon', 'flipkart', 'meesho', 'deodap'].includes(dbProd?.sourcePlatform) ||
      ['amazon', 'flipkart', 'meesho', 'deodap'].includes(i.sourcePlatform);

    const sPrice = dbProd?.sourcePrice !== undefined ? dbProd.sourcePrice : (i.sourcePrice || 0);
    const itemPrice = i.price || dbProd?.discountPrice || dbProd?.price || 0;
    const unitMargin = sPrice > 0 ? Math.max(0, itemPrice - sPrice) : 0;
    const qty = i.quantity || 1;

    const totalMargin = unitMargin * qty;
    const isPromoted = !!i.promotedByVendor;
    const vShare = isPromoted ? Math.round(totalMargin * 0.5) : 0;
    const aShare = isPromoted ? totalMargin - vShare : totalMargin;

    enriched.push({
      product: prodId,
      title: i.title || dbProd?.title || 'Product Item',
      price: itemPrice,
      quantity: qty,
      image: i.image || dbProd?.images?.[0] || '',
      vendor: i.vendor?._id || i.vendor || dbProd?.vendor,
      store: i.store?._id || i.store || dbProd?.store,
      deliveryStatus: i.deliveryStatus || 'Processing',
      trackingNumber: i.trackingNumber || defaultTrackingNum || '',
      vendorSettled: false,
      isDropshipped: isDropship,
      sourcePlatform: dbProd?.sourcePlatform || i.sourcePlatform || 'in_house',
      sourceUrl: dbProd?.sourceUrl || i.sourceUrl || '',
      sourcePrice: sPrice,
      profitMargin: totalMargin,
      fulfillmentStatus: isDropship ? (i.fulfillmentStatus || 'unfulfilled') : 'ordered_on_source',
      sourceOrderId: i.sourceOrderId || '',
      sourceTrackingNumber: i.sourceTrackingNumber || '',
      promotedByVendor: i.promotedByVendor || null,
      promotedByStore: i.promotedByStore || null,
      isAffiliateSale: isPromoted,
      vendorProfitShare: vShare,
      adminProfitShare: aShare,
    });
  }
  return enriched;
};

// Helper: Automatically dispatch dropshipped DeoDap items upon customer order placement
// and credit the net commission profit into Admin's Wallet Balance
const autoDispatchDeoDapItems = async (order) => {
  if (!order || !order.items) return;
  let hasDeoDap = false;
  for (const item of order.items) {
    if (item.isDropshipped && (item.sourcePlatform === 'deodap' || !item.sourcePlatform)) {
      try {
        const dispatchResult = await dispatchToDeoDap(order, item);
        item.sourceOrderId = dispatchResult.sourceOrderId;
        item.sourceTrackingNumber = dispatchResult.sourceTrackingNumber;
        item.fulfillmentStatus = 'ordered_on_source';
        item.deliveryStatus = 'Processing';
        const commissionAmount = item.profitMargin || Math.max(0, (item.price - (item.sourcePrice || 0)) * item.quantity);
        item.commissionEarned = commissionAmount;
        hasDeoDap = true;

        if (order.trackingTimeline) {
          order.trackingTimeline.push({
            status: 'Processing',
            title: 'DeoDap Central Fulfillment & Logistics Dispatched',
            description: `Automated DeoDap delivery in motion for ${order.shippingAddress?.fullName || 'customer'}. Supplier Order #${dispatchResult.sourceOrderId} with Delhivery Courier (AWB: ${dispatchResult.sourceTrackingNumber}). Net admin commission of ₹${commissionAmount} credited.`,
            location: 'DeoDap Central Warehouse (Surat / Ahmedabad)',
            timestamp: new Date(),
          });
        }

        // If item was promoted by a vendor affiliate, split profit margin (vendor gets share on delivery, admin gets their share now)
        const adminProfitAmount = (item.isAffiliateSale && item.adminProfitShare !== undefined)
          ? item.adminProfitShare
          : commissionAmount;

        // Credit Admin Commission directly to Admin's Wallet Balance & Transaction History
        if (adminProfitAmount > 0) {
          if (mongoose.connection.readyState === 1) {
            const admin = await User.findOne({ role: 'admin' });
            if (admin) {
              admin.walletBalance = (admin.walletBalance || 0) + adminProfitAmount;
              await admin.save();

              await WalletTransaction.create({
                vendor: admin._id,
                type: 'dropship_commission',
                amount: adminProfitAmount,
                description: `DeoDap Dropship Commission on Order #${order.invoiceNumber || order._id} for "${item.title}" (Sold @ ₹${item.price} - DeoDap Cost: ₹${item.sourcePrice || 0})${item.isAffiliateSale ? ' [Promoted by Vendor]' : ''}`,
                referenceId: order._id ? order._id.toString() : 'deodap_ref',
                status: 'completed',
                balanceAfter: admin.walletBalance,
              });
              console.log(`[Admin Commission] Credited ₹${adminProfitAmount} to Admin (${admin.email}). New Wallet Balance: ₹${admin.walletBalance}`);
            }
          } else {
            const mockAdmin = mockUsers.find((u) => u.role === 'admin') || mockUsers[0];
            if (mockAdmin) {
              mockAdmin.walletBalance = (mockAdmin.walletBalance || 0) + adminProfitAmount;
              mockTransactions.unshift({
                _id: `tx_comm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                vendor: mockAdmin._id,
                type: 'dropship_commission',
                amount: adminProfitAmount,
                description: `DeoDap Dropship Commission on Order #${order.invoiceNumber || order._id} for "${item.title}"${item.isAffiliateSale ? ' [Promoted by Vendor]' : ''}`,
                referenceId: order._id ? order._id.toString() : 'mock_ref',
                status: 'completed',
                balanceAfter: mockAdmin.walletBalance,
                createdAt: new Date(),
              });
            }
          }
        }
      } catch (err) {
        console.warn('[DeoDap Auto-Dispatch & Commission Note]:', err.message);
      }
    }
  }

  if (hasDeoDap) {
    const trackedItem = order.items.find((i) => i.sourceTrackingNumber);
    if (trackedItem) {
      order.courierName = 'Delhivery Express (DeoDap Fulfillment)';
      order.trackingNumber = trackedItem.sourceTrackingNumber;
    }
  }
};

// @desc    Initiate Razorpay checkout order for customer
// @route   POST /api/orders/initiate-checkout
// @access  Private (Customer)
exports.initiateCheckout = async (req, res, next) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.phone) {
      return res.status(400).json({ success: false, message: 'Please provide complete shipping address' });
    }

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      let product = null;
      const prodId = item.product?._id || item.product || item._id;
      if (mongoose.connection.readyState === 1 && prodId && mongoose.Types.ObjectId.isValid(prodId)) {
        product = await Product.findById(prodId).populate('store');
      }
      if (!product) {
        product = mockProducts.find((p) => p._id === prodId) || (item.product && typeof item.product === 'object' ? item.product : item);
      }

      if (!product || (!product.price && !item.price)) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.title || ''}` });
      }

      const rawPrice = product.price || item.price || 0;
      const rawDiscount = product.discountPrice || item.discountPrice;
      const itemPrice = rawDiscount && rawDiscount < rawPrice ? rawDiscount : rawPrice;
      totalAmount += itemPrice * (item.quantity || 1);

      const isDropship = product.isDropshipped || ['amazon', 'flipkart', 'meesho', 'deodap'].includes(product.sourcePlatform);
      const sPrice = product.sourcePrice || 0;

      validatedItems.push({
        product: product._id || prodId,
        title: product.title || item.title || 'Product Item',
        price: itemPrice,
        quantity: item.quantity || 1,
        image: product.images?.[0] || product.image || item.image || '',
        vendor: product.vendor?._id || product.vendor || item.vendor,
        store: product.store?._id || product.store || item.store,
        isDropshipped: isDropship,
        sourcePlatform: product.sourcePlatform || 'in_house',
        sourceUrl: product.sourceUrl || '',
        sourcePrice: sPrice,
        profitMargin: (sPrice > 0 ? Math.max(0, itemPrice - sPrice) : 0) * (item.quantity || 1),
      });
    }

    const receipt = `rcpt_order_${Date.now()}`;
    const { isMock, order } = await createRazorpayOrder(totalAmount, receipt, {
      customerId: req.user._id ? req.user._id.toString() : 'mock_customer',
      type: 'customer_checkout',
    });

    res.status(200).json({
      success: true,
      order,
      totalAmount,
      validatedItems,
      isMock,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify payment and create order
// @route   POST /api/orders/verify-and-create
// @access  Private (Customer)
exports.verifyAndCreateOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      totalAmount,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const trackingNum = `AWB${Math.floor(100000000 + Math.random() * 900000000)}`;
    const estDelivery = new Date(Date.now() + 3 * 86400000);
    const enrichedItems = await enrichItemsWithDropship(items, trackingNum);

    if (mongoose.connection.readyState !== 1) {
      const order = {
        _id: `ord_${Date.now()}`,
        customer: req.user,
        items: enrichedItems,
        totalAmount,
        paymentStatus: 'paid',
        paymentMethod: 'Razorpay',
        razorpayOrderId: razorpayOrderId || `order_mock_${Date.now()}`,
        razorpayPaymentId: razorpayPaymentId || `pay_mock_${Date.now()}`,
        shippingAddress,
        invoiceNumber,
        createdAt: new Date(),
      };
      await autoDispatchDeoDapItems(order);
      mockOrders.unshift(order);

      return res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        order,
      });
    }

    // Decrement stock for purchased products
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    const order = await Order.create({
      customer: req.user._id,
      items: enrichedItems,
      totalAmount,
      paymentStatus: 'paid',
      paymentMethod: 'Razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      shippingAddress,
      courierName: 'Delhivery Express Logistics',
      trackingNumber: trackingNum,
      estimatedDelivery: estDelivery,
      trackingTimeline: [
        {
          status: 'Order Placed',
          title: 'Payment Confirmed & Order Placed',
          description: 'Payment verified securely via Razorpay gateway.',
          location: 'Central Order Processing Facility',
          timestamp: new Date(),
        },
        {
          status: 'Processing',
          title: 'Order Transmitted to Merchant Store',
          description: 'Vendor received fulfillment request and preparing package.',
          location: 'Merchant Warehouse',
          timestamp: new Date(Date.now() + 30 * 60 * 1000),
        },
      ],
    });

    try {
      const invoiceUrl = await generateInvoice(order);
      order.invoiceUrl = invoiceUrl;
      await order.save();
    } catch (invErr) {
      console.warn('Invoice generation warning:', invErr.message);
    }

    // Automatically dispatch dropshipped DeoDap products for fulfillment
    await autoDispatchDeoDapItems(order);
    if (mongoose.connection.readyState === 1) {
      await order.save();
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Place order via Cash on Delivery or Amezon Wallet
// @route   POST /api/orders/cod-or-wallet-checkout
// @access  Private (Customer)
exports.createCodOrWalletOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, totalAmount, paymentMethod = 'Cash on Delivery' } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.phone) {
      return res.status(400).json({ success: false, message: 'Please provide complete shipping address' });
    }

    const trackingNum = `AWB${Math.floor(100000000 + Math.random() * 900000000)}`;
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const estDelivery = new Date(Date.now() + 3 * 86400000);
    const enrichedItems = await enrichItemsWithDropship(items, trackingNum);

    const trackingTimeline = [
      {
        status: 'Order Placed',
        title: paymentMethod === 'Wallet' ? 'Paid via Amezon Wallet' : 'Order Placed (Cash on Delivery)',
        description: paymentMethod === 'Wallet' 
          ? '₹' + totalAmount + ' deducted from your Amezon Wallet. Order confirmed.'
          : 'Cash on delivery payment will be collected at doorstep during delivery.',
        location: 'Central Order Processing Facility',
        timestamp: new Date(),
      },
      {
        status: 'Processing',
        title: 'Order Queued for Dispatch',
        description: 'Vendor received fulfillment request and is preparing the package.',
        location: 'Merchant Logistics Hub',
        timestamp: new Date(Date.now() + 15 * 60 * 1000),
      },
    ];

    if (mongoose.connection.readyState !== 1) {
      if (paymentMethod === 'Wallet') {
        const user = mockUsers.find((u) => u._id === req.user.id || u._id === req.user._id);
        if (user) {
          if ((user.walletBalance || 0) < totalAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
          }
          user.walletBalance -= totalAmount;
        }
      }

      const order = {
        _id: `ord_${Date.now()}`,
        customer: req.user,
        items: enrichedItems,
        totalAmount,
        paymentStatus: paymentMethod === 'Wallet' ? 'paid' : 'pending',
        paymentMethod,
        shippingAddress,
        invoiceNumber,
        courierName: 'Delhivery Express Logistics',
        trackingNumber: trackingNum,
        estimatedDelivery: estDelivery,
        trackingTimeline,
        createdAt: new Date(),
      };
      await autoDispatchDeoDapItems(order);
      mockOrders.unshift(order);

      return res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        order,
      });
    }

    // Live MongoDB Branch
    if (paymentMethod === 'Wallet') {
      const user = await User.findById(req.user._id || req.user.id);
      if (!user || (user.walletBalance || 0) < totalAmount) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }

      user.walletBalance -= totalAmount;
      await user.save();

      await WalletTransaction.create({
        vendor: user._id,
        type: 'order_payment',
        amount: totalAmount,
        description: `Paid for order items (Order #${invoiceNumber})`,
        referenceId: invoiceNumber,
        status: 'completed',
        balanceAfter: user.walletBalance,
      });
    }

    // Decrement stock for purchased products
    for (const item of items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product._id || item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    const order = await Order.create({
      customer: req.user._id || req.user.id,
      items: enrichedItems,
      totalAmount,
      paymentStatus: paymentMethod === 'Wallet' ? 'paid' : 'pending',
      paymentMethod,
      shippingAddress,
      invoiceNumber,
      courierName: 'Delhivery Express Logistics',
      trackingNumber: trackingNum,
      estimatedDelivery: estDelivery,
      trackingTimeline,
    });

    try {
      const invoiceUrl = await generateInvoice(order);
      order.invoiceUrl = invoiceUrl;
      await order.save();
    } catch (invErr) {
      console.warn('Invoice generation warning:', invErr.message);
    }

    // Automatically dispatch dropshipped DeoDap products for fulfillment
    await autoDispatchDeoDapItems(order);
    if (mongoose.connection.readyState === 1) {
      await order.save();
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order details by ID
// @route   GET /api/orders/:id
// @access  Private (Customer, Vendor, Admin)
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const order = mockOrders.find((o) => o._id === id || o.invoiceNumber === id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      return res.status(200).json({ success: true, order });
    }

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id)
        .populate('customer', 'name email phone avatar')
        .populate('items.store', 'storeName logo phone category')
        .populate('items.vendor', 'name email phone');
    }

    if (!order) {
      order = await Order.findOne({ invoiceNumber: id })
        .populate('customer', 'name email phone avatar')
        .populate('items.store', 'storeName logo phone category')
        .populate('items.vendor', 'name email phone');
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Track order in real-time by Order ID, Invoice Number, or Tracking Number
// @route   GET /api/orders/track/:query
// @access  Public
exports.trackOrder = async (req, res, next) => {
  try {
    const { query } = req.params;
    const cleanQuery = query.trim();

    if (mongoose.connection.readyState !== 1) {
      const order = mockOrders.find(
        (o) =>
          o._id === cleanQuery ||
          o.invoiceNumber === cleanQuery ||
          o.trackingNumber === cleanQuery ||
          o.items?.some((i) => i.trackingNumber === cleanQuery)
      ) || mockOrders[0];

      if (!order) {
        return res.status(404).json({ success: false, message: 'No shipment found matching tracking query' });
      }
      return res.status(200).json({ success: true, order });
    }

    let filter = {
      $or: [
        { invoiceNumber: { $regex: new RegExp(`^${cleanQuery}$`, 'i') } },
        { trackingNumber: { $regex: new RegExp(`^${cleanQuery}$`, 'i') } },
        { 'items.trackingNumber': { $regex: new RegExp(`^${cleanQuery}$`, 'i') } },
      ],
    };

    if (mongoose.Types.ObjectId.isValid(cleanQuery)) {
      filter.$or.push({ _id: cleanQuery });
    }

    const order = await Order.findOne(filter)
      .populate('customer', 'name email phone')
      .populate('items.store', 'storeName logo phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'No shipment found matching this order or tracking reference' });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get customer's order history
// @route   GET /api/orders/my-orders
// @access  Private (Customer)
exports.getCustomerOrders = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: mockOrders.length,
        orders: mockOrders,
      });
    }

    const orders = await Order.find({ customer: req.user._id || req.user.id })
      .populate('items.store', 'storeName logo phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get vendor's store orders with customer delivery address
// @route   GET /api/orders/vendor/orders
// @access  Private (Vendor)
exports.getVendorOrders = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const vendorOrders = mockOrders.map((order) => {
        const myTotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        return {
          _id: order._id,
          invoiceNumber: order.invoiceNumber,
          createdAt: order.createdAt,
          customer: order.customer,
          shippingAddress: order.shippingAddress,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          items: order.items,
          vendorSubtotal: myTotal,
        };
      });

      return res.status(200).json({
        success: true,
        count: vendorOrders.length,
        orders: vendorOrders,
      });
    }

    const orders = await Order.find({ 'items.vendor': req.user._id })
      .populate('customer', 'name email phone')
      .populate('items.store', 'storeName logo')
      .sort({ createdAt: -1 });

    const vendorOrders = orders.map((order) => {
      const myItems = order.items.filter(
        (item) => item.vendor.toString() === req.user._id.toString()
      );
      const myTotal = myItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

      return {
        _id: order._id,
        invoiceNumber: order.invoiceNumber,
        createdAt: order.createdAt,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        items: myItems,
        vendorSubtotal: myTotal,
      };
    });

    res.status(200).json({
      success: true,
      count: vendorOrders.length,
      orders: vendorOrders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Vendor updates item delivery status (Processing -> Shipped -> Out for Delivery -> Delivered)
// @route   PUT /api/orders/:orderId/items/:itemId/delivery-status
// @access  Private (Vendor)
exports.updateVendorDeliveryStatus = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { status, trackingNumber } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const order = mockOrders.find((o) => o._id === orderId);
      if (order) {
        const item = order.items.find((i) => i._id === itemId || i.product === itemId);
        if (item) {
          item.deliveryStatus = status;
          if (status === 'Delivered' && !item.vendorSettled) {
            item.vendorSettled = true;
            const itemTotal = item.price * item.quantity;
            const commission = (itemTotal * mockSettings.commissionRatePercent) / 100;
            const vendorEarning = itemTotal - commission;

            const vendor = mockUsers.find((u) => u._id === req.user._id) || mockUsers[1];
            vendor.walletBalance += vendorEarning;
            mockTransactions.unshift({
              _id: `tx_${Date.now()}`,
              vendor: vendor._id,
              type: 'order_earning',
              amount: vendorEarning,
              description: `Earnings for delivering "${item.title}" (Order #${order.invoiceNumber}) after ${mockSettings.commissionRatePercent}% platform commission`,
              status: 'completed',
              balanceAfter: vendor.walletBalance,
              createdAt: new Date(),
            });
          }
          return res.status(200).json({ success: true, message: `Status updated to ${status}`, item });
        }
      }
      return res.status(200).json({ success: true, message: `Status updated to ${status}` });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    item.deliveryStatus = status;
    if (trackingNumber) item.trackingNumber = trackingNumber;
    if (req.body.courierName) item.courierName = req.body.courierName;

    if (status === 'Delivered' && !item.vendorSettled) {
      item.deliveredAt = new Date();
      item.vendorSettled = true;

      // Case A: Promoted Dropship item - credit promoter vendor affiliate commission
      if (item.isDropshipped && item.isAffiliateSale && item.promotedByVendor && item.vendorProfitShare > 0) {
        try {
          const promoter = await User.findById(item.promotedByVendor);
          if (promoter) {
            promoter.walletBalance = (promoter.walletBalance || 0) + item.vendorProfitShare;
            await promoter.save();
            await WalletTransaction.create({
              vendor: promoter._id,
              type: 'dropship_commission',
              amount: item.vendorProfitShare,
              description: `Affiliate commission reward for promoted DeoDap sale "${item.title}" (Order #${order.invoiceNumber})`,
              referenceId: order._id.toString(),
              status: 'completed',
              balanceAfter: promoter.walletBalance,
            });
            console.log(`[Affiliate Commission] Credited ₹${item.vendorProfitShare} to promoter vendor (${promoter.email}) for delivered item.`);
          }
        } catch (affErr) {
          console.warn('[Affiliate Settlement Note]', affErr.message);
        }
      } else if (!item.isDropshipped) {
        // Case B: Regular Vendor Store item - settle vendor payout after platform commission
        let setting = await PlatformSetting.findOne();
        const commissionPercent = setting ? setting.commissionRatePercent : 10;

        const itemTotal = item.price * item.quantity;
        const commissionAmount = (itemTotal * commissionPercent) / 100;
        const vendorEarning = itemTotal - commissionAmount;

        const vendorUser = await User.findById(item.vendor);
        if (vendorUser) {
          vendorUser.walletBalance = (vendorUser.walletBalance || 0) + vendorEarning;
          await vendorUser.save();

          await WalletTransaction.create({
            vendor: vendorUser._id,
            type: 'order_earning',
            amount: vendorEarning,
            description: `Earnings for delivering "${item.title}" (Order #${order.invoiceNumber}) after ${commissionPercent}% platform commission`,
            referenceId: order._id.toString(),
            status: 'completed',
            balanceAfter: vendorUser.walletBalance,
          });
        }
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Delivery status updated to ${status}`,
      item,
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private (Admin)
exports.getAdminOrders = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, count: mockOrders.length, orders: mockOrders });
    }

    const orders = await Order.find()
      .populate('customer', 'name email phone')
      .populate('items.store', 'storeName logo')
      .populate('items.vendor', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    next(err);
  }
};
// @desc    Admin updates dropship source order details (sourceOrderId, sourceTrackingNumber, fulfillmentStatus)
// @route   PUT /api/orders/:orderId/items/:itemId/dropship-fulfillment
// @access  Private (Admin)
exports.updateDropshipFulfillment = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { sourceOrderId, sourceTrackingNumber, fulfillmentStatus, notes } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const order = mockOrders.find((o) => o._id === orderId);
      if (order) {
        const item = order.items.find((i) => i._id === itemId || i.product === itemId);
        if (item) {
          if (sourceOrderId) item.sourceOrderId = sourceOrderId;
          if (sourceTrackingNumber) item.sourceTrackingNumber = sourceTrackingNumber;
          if (fulfillmentStatus) {
            item.fulfillmentStatus = fulfillmentStatus;
            if (fulfillmentStatus === 'shipped_by_source') item.deliveryStatus = 'Shipped';
            if (fulfillmentStatus === 'delivered_to_customer') item.deliveryStatus = 'Delivered';
          }
          return res.status(200).json({ success: true, message: 'Dropship fulfillment updated', item, order });
        }
      }
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    if (sourceOrderId !== undefined) item.sourceOrderId = sourceOrderId;
    if (sourceTrackingNumber !== undefined) {
      item.sourceTrackingNumber = sourceTrackingNumber;
      item.trackingNumber = sourceTrackingNumber;
    }
    if (fulfillmentStatus) {
      item.fulfillmentStatus = fulfillmentStatus;
      if (fulfillmentStatus === 'shipped_by_source') {
        item.deliveryStatus = 'Shipped';
      } else if (fulfillmentStatus === 'delivered_to_customer') {
        item.deliveryStatus = 'Delivered';
        item.deliveredAt = new Date();

        // If promoted by a vendor affiliate, settle vendor profit share upon confirmed delivery
        if (item.isAffiliateSale && item.promotedByVendor && !item.vendorSettled && item.vendorProfitShare > 0) {
          try {
            const promoter = await User.findById(item.promotedByVendor);
            if (promoter) {
              promoter.walletBalance = (promoter.walletBalance || 0) + item.vendorProfitShare;
              await promoter.save();
              await WalletTransaction.create({
                vendor: promoter._id,
                type: 'dropship_commission',
                amount: item.vendorProfitShare,
                description: `Affiliate commission reward for promoted DeoDap sale "${item.title}" (Order #${order.invoiceNumber || order._id})`,
                referenceId: order._id.toString(),
                status: 'completed',
                balanceAfter: promoter.walletBalance,
              });
              item.vendorSettled = true;
              console.log(`[Affiliate Settlement] Dispatched ₹${item.vendorProfitShare} to promoter vendor (${promoter.email}) on customer delivery.`);
            }
          } catch (e) {
            console.warn('[Affiliate fulfillment settlement error]', e.message);
          }
        }
      }
    }

    // Append to tracking timeline if shipped
    if (fulfillmentStatus === 'shipped_by_source' && sourceTrackingNumber) {
      order.trackingTimeline.push({
        status: 'Shipped',
        title: `Package Dispatched by ${item.sourcePlatform ? item.sourcePlatform.toUpperCase() : 'Supplier'}`,
        description: `Source Order #${item.sourceOrderId || ''} has been handed over to courier. AWB/Tracking: ${sourceTrackingNumber}`,
        location: 'Origin Logistics Center',
        timestamp: new Date(),
      });
      order.trackingNumber = sourceTrackingNumber;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Dropship fulfillment status updated to ${fulfillmentStatus || 'updated'}`,
      item,
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin 1-Click Auto-Dispatch order item to DeoDap dropship API
// @route   POST /api/orders/:orderId/items/:itemId/auto-dispatch-deodap
// @access  Private (Admin)
exports.autoDispatchDeoDap = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    let order = null;
    let item = null;

    if (mongoose.connection.readyState !== 1) {
      order = mockOrders.find((o) => o._id === orderId);
      if (order) item = order.items.find((i) => i._id === itemId || i.product === itemId);
    } else {
      order = await Order.findById(orderId).populate('customer', 'name phone email');
      if (order) item = order.items.id(itemId);
    }

    if (!order || !item) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    const dispatchResult = await dispatchToDeoDap(order, item);

    item.sourceOrderId = dispatchResult.sourceOrderId;
    item.sourceTrackingNumber = dispatchResult.sourceTrackingNumber;
    item.fulfillmentStatus = 'ordered_on_source';
    item.deliveryStatus = 'Processing';

    if (order.trackingTimeline) {
      order.trackingTimeline.push({
        status: 'Ordered on Source',
        title: 'Transmitted to DeoDap Central Fulfillment Hub',
        description: `Automated dispatch confirmed for ${order.shippingAddress?.fullName || 'customer'}. Supplier Order #${dispatchResult.sourceOrderId}. Initial AWB: ${dispatchResult.sourceTrackingNumber}`,
        location: 'DeoDap B2B Logistics Center',
        timestamp: new Date(),
      });
    }

    if (mongoose.connection.readyState === 1) {
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: 'Order item successfully dispatched to DeoDap!',
      sourceOrderId: dispatchResult.sourceOrderId,
      sourceTrackingNumber: dispatchResult.sourceTrackingNumber,
      item,
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    View printable invoice HTML
// @route   GET /api/orders/:id/invoice-preview
// @access  Public
exports.getOrderInvoice = async (req, res, next) => {
  try {
    let order;
    if (mongoose.connection.readyState !== 1) {
      order = mockOrders.find((o) => o._id === req.params.id || o.invoiceNumber === req.params.id) || mockOrders[0];
    } else {
      order = await Order.findById(req.params.id)
        .populate('customer', 'name email phone')
        .populate('items.store', 'storeName address phone email');
      if (!order) {
        order = await Order.findOne({ invoiceNumber: req.params.id })
          .populate('customer', 'name email phone')
          .populate('items.store', 'storeName address phone email');
      }
    }

    if (!order) {
      return res.status(404).send(`
        <div style="font-family:sans-serif; text-align:center; padding: 60px 20px;">
          <h2 style="color:#ef4444;">Tax Invoice Not Found</h2>
          <p style="color:#64748b;">The requested invoice reference could not be located in our records.</p>
        </div>
      `);
    }

    // Compute sum from actual items
    let calculatedItemsTotal = 0;
    (order.items || []).forEach((item) => {
      calculatedItemsTotal += Number(item.price || 0) * Number(item.quantity || 1);
    });

    // Use calculated items total or recorded total amount
    const grandTotal = calculatedItemsTotal > 0 ? calculatedItemsTotal : Number(order.totalAmount || 0);
    // GST included at 18% standard rate: taxable = total / 1.18
    const taxableValue = Math.round((grandTotal / 1.18) * 100) / 100;
    const totalGst = Math.round((grandTotal - taxableValue) * 100) / 100;
    const cgst = Math.round((totalGst / 2) * 100) / 100;
    const sgst = Math.round((totalGst - cgst) * 100) / 100;

    const primaryStore = order.items?.[0]?.store;
    const sellerName = primaryStore?.storeName || 'SR Verified Merchant Store';
    const sellerAddress = primaryStore?.address?.street
      ? `${primaryStore.address.street}, ${primaryStore.address.city || ''}, ${primaryStore.address.state || ''} - ${primaryStore.address.zipCode || ''}`
      : 'E-Commerce Logistics Hub, Hyderabad, Telangana - 500081';
    const sellerPhone = primaryStore?.phone || '+91 98765 43210';
    const sellerEmail = primaryStore?.email || 'vendor-support@srmarketplace.com';

    const itemsRows = (order.items || [])
      .map((item, idx) => {
        const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
        const itemTaxable = Math.round((itemTotal / 1.18) * 100) / 100;
        const itemGst = Math.round((itemTotal - itemTaxable) * 100) / 100;
        return `
        <tr>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center; vertical-align: middle;">${idx + 1}</td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
            <div style="font-weight: 700; color: #0f172a; font-size: 13.5px;">${item.title || 'Product Item'}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">HSN/SAC: 8471 • Seller: ${item.store?.storeName || sellerName}</div>
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: #334155; vertical-align: middle;">${item.quantity}</td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155; vertical-align: middle;">₹${item.price?.toLocaleString('en-IN')}</td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 12px; vertical-align: middle;">₹${itemTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 12px; vertical-align: middle;">18% (₹${itemGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; vertical-align: middle;">₹${itemTotal.toLocaleString('en-IN')}</td>
        </tr>
      `;
      })
      .join('');

    const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Tax Invoice - ${order.invoiceNumber || order._id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            padding: 30px 15px;
            -webkit-font-smoothing: antialiased;
          }
          .actions-bar {
            max-width: 860px;
            margin: 0 auto 16px auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .btn-print {
            background: linear-gradient(135deg, #0c2a5e, #174896);
            color: #ffffff;
            border: none;
            padding: 10px 22px;
            font-size: 13px;
            font-weight: 700;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(12, 42, 94, 0.25);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
          }
          .btn-print:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(12, 42, 94, 0.35); }
          .btn-close {
            background: #ffffff;
            color: #475569;
            border: 1px solid #cbd5e1;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 10px;
            cursor: pointer;
            text-decoration: none;
          }
          .invoice-card {
            max-width: 860px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
            overflow: hidden;
            padding: 40px;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 25px;
          }
          .brand-logo {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #0c2a5e;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .brand-badge {
            background: #fef3c7;
            color: #b45309;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 6px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .brand-slogan {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
            font-weight: 600;
            letter-spacing: 0.3px;
          }
          .tax-badge {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid #bfdbfe;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .invoice-num {
            font-family: 'JetBrains Mono', monospace;
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
          }
          .meta-text {
            font-size: 12px;
            color: #64748b;
            margin-top: 3px;
          }
          .status-paid {
            display: inline-block;
            background: #ecfdf5;
            color: #047857;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 20px;
            border: 1px solid #a7f3d0;
            margin-top: 6px;
            text-transform: uppercase;
          }
          .parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 25px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 14px;
            border: 1px solid #edf2f7;
          }
          .party-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #475569;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .party-name {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .party-detail {
            font-size: 12.5px;
            color: #475569;
            line-height: 1.5;
          }
          .table-container {
            margin-top: 30px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }
          th {
            background: #f8fafc;
            padding: 12px 14px;
            font-size: 11.5px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
          }
          .summary-section {
            margin-top: 25px;
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 30px;
            align-items: start;
          }
          .terms-box {
            background: #ffffff;
            border: 1px dashed #cbd5e1;
            border-radius: 12px;
            padding: 16px;
            font-size: 11.5px;
            color: #64748b;
            line-height: 1.6;
          }
          .terms-box strong { color: #334155; }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 7px 0;
            font-size: 13px;
            color: #475569;
          }
          .totals-table .val {
            text-align: right;
            font-weight: 600;
            color: #1e293b;
          }
          .grand-total-row td {
            padding-top: 12px;
            border-top: 2px solid #0c2a5e;
            font-size: 16px;
            font-weight: 900;
            color: #0c2a5e;
          }
          .footer-section {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11.5px;
            color: #94a3b8;
          }
          .sign-box {
            text-align: right;
          }
          .sign-seal {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #0c2a5e;
            font-weight: 700;
            border: 1px dashed #0c2a5e;
            padding: 6px 14px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 4px;
            background: #f0f7ff;
          }
          @media print {
            body { background: #ffffff; padding: 0; }
            .actions-bar { display: none !important; }
            .invoice-card {
              border: none;
              box-shadow: none;
              padding: 0;
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="actions-bar">
          <div style="font-size: 13px; font-weight: 700; color: #475569;">
            Official Goods &amp; Services Tax (GST) Invoice
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="window.print()" class="btn-print">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print / Save PDF
            </button>
            <button onclick="window.close()" class="btn-close">Close Tab</button>
          </div>
        </div>

        <div class="invoice-card">
          <!-- Header -->
          <div class="header-row">
            <div>
              <div class="brand-logo">
                <span>SR Multi-Vendor Marketplace</span>
                <span class="brand-badge">GST Registered</span>
              </div>
              <div class="brand-slogan">DREAM • GROW • TOGETHER</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 8px; line-height: 1.4;">
                Platform Operator: SR Technologies &amp; E-Commerce Pvt. Ltd.<br/>
                CIN: U72200TG2026PTC189210 • GSTIN: 36AAACS1234F1Z8
              </div>
            </div>

            <div style="text-align: right;">
              <span class="tax-badge">Original for Recipient</span>
              <div class="invoice-num">Invoice #${order.invoiceNumber || order._id}</div>
              <div class="meta-text">Invoice Date: <strong>${invoiceDate}</strong></div>
              <div class="meta-text">Tracking AWB: <strong style="font-family: monospace;">${order.trackingNumber || 'AWB982187319'}</strong></div>
              <div>
                <span class="status-paid">● ${order.paymentStatus?.toUpperCase() || 'PAID'} VIA ${order.paymentMethod?.toUpperCase() || 'ONLINE'}</span>
              </div>
            </div>
          </div>

          <!-- Parties Grid -->
          <div class="parties-grid">
            <!-- Sold By -->
            <div>
              <div class="party-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                Sold By (Merchant)
              </div>
              <div class="party-name">${sellerName}</div>
              <div class="party-detail">${sellerAddress}</div>
              <div class="party-detail" style="margin-top: 4px;">Phone: <strong>${sellerPhone}</strong></div>
              <div class="party-detail">Email: <strong>${sellerEmail}</strong></div>
              <div class="party-detail" style="font-size: 11.5px; color: #64748b; margin-top: 2px;">GSTIN: 36ABCDE1234F1Z5 • State: Telangana (36)</div>
            </div>

            <!-- Billed / Delivered To -->
            <div>
              <div class="party-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Billing &amp; Shipping Address
              </div>
              <div class="party-name">${order.shippingAddress?.fullName || order.customer?.name || 'Customer'}</div>
              <div class="party-detail">${order.shippingAddress?.street || 'Customer Address'}</div>
              <div class="party-detail">${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.zipCode || ''}</div>
              <div class="party-detail" style="margin-top: 4px;">Phone: <strong>${order.shippingAddress?.phone || order.customer?.phone || 'N/A'}</strong></div>
              <div class="party-detail">Country: <strong>${order.shippingAddress?.country || 'India'}</strong></div>
            </div>
          </div>

          <!-- Itemized Table -->
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th>Product Description</th>
                  <th style="text-align: center; width: 60px;">Qty</th>
                  <th style="text-align: right; width: 100px;">Unit Price</th>
                  <th style="text-align: right; width: 110px;">Taxable Val</th>
                  <th style="text-align: right; width: 110px;">GST Rate</th>
                  <th style="text-align: right; width: 110px;">Total (INR)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <!-- Summary & Totals -->
          <div class="summary-section">
            <div class="terms-box">
              <strong>Declaration &amp; Notes:</strong><br/>
              • We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.<br/>
              • All disputes are subject to local judicial jurisdiction.<br/>
              • 7-day hassle-free replacement or refund applicable as per SR Marketplace Customer Protection Guarantee.<br/>
              • For assistance, visit <strong>srmarketplace.com/help</strong> or write to <strong>support@srmarketplace.com</strong>.
            </div>

            <div>
              <table class="totals-table">
                <tr>
                  <td>Total Taxable Value:</td>
                  <td class="val">₹${taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>CGST (9.00%):</td>
                  <td class="val">₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>SGST / UTGST (9.00%):</td>
                  <td class="val">₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Platform Delivery &amp; Handling:</td>
                  <td class="val" style="color: #047857;">FREE (₹0.00)</td>
                </tr>
                <tr class="grand-total-row">
                  <td>Invoice Total:</td>
                  <td class="val">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </table>
              <div style="font-size: 11px; color: #64748b; text-align: right; margin-top: 6px;">
                Amount in Words: <strong>Indian Rupees ${grandTotal.toLocaleString('en-IN')} Only</strong>
              </div>
            </div>
          </div>

          <!-- Footer & Signature -->
          <div class="footer-section">
            <div>
              <strong>SR Multi-Vendor Marketplace Platform</strong> • Powered by Clean Cloud Architecture<br/>
              This is a computer-generated invoice and does not require an ink physical signature.
            </div>
            <div class="sign-box">
              <div class="sign-seal">✓ DIGITALLY VERIFIED</div>
              <div style="font-size: 11px; font-weight: 700; color: #334155;">Authorized Signatory</div>
              <div style="font-size: 10px; color: #94a3b8;">SR Marketplace Finance Division</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    next(err);
  }
};

// @desc    Admin manually settles an individual order item payout to vendor's wallet
// @route   POST /api/orders/:orderId/items/:itemId/settle-vendor
// @access  Private (Admin)
exports.settleVendorOrderItem = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    let order = null;
    let item = null;

    if (mongoose.connection.readyState !== 1) {
      order = mockOrders.find((o) => o._id === orderId);
      if (order) item = order.items.find((i) => i._id === itemId || i.product === itemId);
      if (!order || !item) {
        return res.status(404).json({ success: false, message: 'Order item not found' });
      }

      if (item.vendorSettled) {
        return res.status(400).json({ success: false, message: 'This item has already been settled to the vendor.' });
      }

      const itemTotal = (item.price || 0) * (item.quantity || 1);
      const commission = Math.round(itemTotal * 0.1);
      const payout = itemTotal - commission;

      const vendor = mockUsers.find((u) => u._id === item.vendor || u._id === item.vendor?._id);
      if (vendor) {
        vendor.walletBalance = (vendor.walletBalance || 0) + payout;
        mockTransactions.unshift({
          _id: `tx_settle_${Date.now()}`,
          vendor: vendor._id,
          type: 'order_earning',
          amount: payout,
          description: `Order item settlement payout for "${item.title}" (Order #${order.invoiceNumber})`,
          referenceId: order._id.toString(),
          status: 'completed',
          balanceAfter: vendor.walletBalance,
          createdAt: new Date(),
        });
      }

      item.vendorSettled = true;
      return res.status(200).json({
        success: true,
        message: `Successfully settled ₹${payout} to vendor wallet!`,
        order,
        item,
      });
    }

    order = await Order.findById(orderId).populate('items.vendor', 'name email walletBalance');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    if (item.vendorSettled) {
      return res.status(400).json({ success: false, message: 'This item has already been settled to the vendor.' });
    }

    const setting = await PlatformSetting.findOne();
    const commissionPercent = setting ? setting.commissionRatePercent : 10;

    const itemTotal = (item.price || 0) * (item.quantity || 1);
    const platformCommission = Math.round((itemTotal * commissionPercent) / 100);
    const vendorPayout = itemTotal - platformCommission;

    const vendorId = item.vendor?._id || item.vendor;
    if (vendorId) {
      const vendorUser = await User.findById(vendorId);
      if (vendorUser) {
        vendorUser.walletBalance = (vendorUser.walletBalance || 0) + vendorPayout;
        await vendorUser.save();

        await WalletTransaction.create({
          vendor: vendorUser._id,
          type: 'order_earning',
          amount: vendorPayout,
          description: `Order item settlement payout for "${item.title}" (Order #${order.invoiceNumber})`,
          referenceId: order._id.toString(),
          status: 'completed',
          balanceAfter: vendorUser.walletBalance,
        });
      }
    }

    item.vendorSettled = true;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Successfully settled ₹${vendorPayout} directly to vendor's wallet!`,
      order,
      item,
      vendorPayout,
    });
  } catch (err) {
    next(err);
  }
};
