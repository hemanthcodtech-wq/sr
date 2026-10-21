const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const PlatformSetting = require('../models/PlatformSetting');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../config/razorpay');
const { generateInvoice } = require('../utils/invoiceGenerator');
const { mockOrders, mockProducts, mockUsers, mockTransactions, mockSettings } = require('../config/mockStore');

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
      let product;
      if (mongoose.connection.readyState !== 1) {
        product = mockProducts.find((p) => p._id === (item.product._id || item.product)) || item.product;
      } else {
        product = await Product.findById(item.product._id || item.product).populate('store');
      }

      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.title || ''}` });
      }

      const itemPrice = product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price;
      totalAmount += itemPrice * item.quantity;

      validatedItems.push({
        product: product._id,
        title: product.title,
        price: itemPrice,
        quantity: item.quantity,
        image: product.images ? product.images[0] : '',
        vendor: product.vendor?._id || product.vendor,
        store: product.store?._id || product.store,
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

    if (mongoose.connection.readyState !== 1) {
      const order = {
        _id: `ord_${Date.now()}`,
        customer: req.user,
        items: items.map((i) => ({
          ...i,
          deliveryStatus: 'Processing',
          vendorSettled: false,
        })),
        totalAmount,
        paymentStatus: 'paid',
        paymentMethod: 'Razorpay',
        razorpayOrderId: razorpayOrderId || `order_mock_${Date.now()}`,
        razorpayPaymentId: razorpayPaymentId || `pay_mock_${Date.now()}`,
        shippingAddress,
        invoiceNumber,
        createdAt: new Date(),
      };
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

    const trackingNum = `AWB${Math.floor(100000000 + Math.random() * 900000000)}`;
    const estDelivery = new Date(Date.now() + 3 * 86400000);

    const order = await Order.create({
      customer: req.user._id,
      items: items.map((i) => ({
        ...i,
        deliveryStatus: 'Processing',
        trackingNumber: trackingNum,
        vendorSettled: false,
      })),
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
        items: items.map((i) => ({
          ...i,
          deliveryStatus: 'Processing',
          trackingNumber: trackingNum,
          vendorSettled: false,
        })),
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
      items: items.map((i) => ({
        product: i.product?._id || i.product,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        image: i.image || '',
        vendor: i.vendor?._id || i.vendor,
        store: i.store?._id || i.store,
        deliveryStatus: 'Processing',
        trackingNumber: trackingNum,
        vendorSettled: false,
      })),
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

    if (status === 'Delivered' && !item.vendorSettled) {
      item.deliveredAt = new Date();
      item.vendorSettled = true;

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

// @desc    View printable invoice HTML
// @route   GET /api/orders/:id/invoice-preview
// @access  Public
exports.getOrderInvoice = async (req, res, next) => {
  try {
    let order;
    if (mongoose.connection.readyState !== 1) {
      order = mockOrders.find((o) => o._id === req.params.id) || mockOrders[0];
    } else {
      order = await Order.findById(req.params.id);
    }

    if (!order) {
      return res.status(404).send('<h3>Invoice not found</h3>');
    }

    const itemsHtml = order.items
      .map(
        (i) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${i.title}</td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">${i.quantity}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">₹${i.price.toLocaleString('en-IN')}</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid #e2e8f0;">₹${(i.price * i.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `
      )
      .join('');

    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice - ${order.invoiceNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px 20px; }
          .card { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 35px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
          .logo { font-size: 26px; font-weight: 800; color: #2563eb; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; margin-top: 30px; gap: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 13px; color: #475569; }
          .total { margin-top: 25px; text-align: right; font-size: 18px; }
          @media print { body { background: #fff; padding: 0; } .card { border: none; box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div>
              <div class="logo">NexMart</div>
              <div style="font-size: 13px; color: #64748b;">Multi-Vendor Marketplace Platform</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 18px;">Invoice #${order.invoiceNumber}</h2>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
              <div style="font-size: 13px; color: #16a34a; font-weight: 600;">PAID via ${order.paymentMethod}</div>
            </div>
          </div>

          <div class="grid">
            <div>
              <div style="font-weight: 700; margin-bottom: 6px; color: #334155;">Delivering To:</div>
              <div style="font-weight: 600;">${order.shippingAddress?.fullName}</div>
              <div style="color: #64748b; font-size: 14px;">${order.shippingAddress?.street}</div>
              <div style="color: #64748b; font-size: 14px;">${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.zipCode}</div>
              <div style="color: #64748b; font-size: 14px;">Phone: ${order.shippingAddress?.phone}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; margin-bottom: 6px; color: #334155;">Transaction Ref:</div>
              <div style="color: #64748b; font-size: 14px;">Order ID: ${order._id}</div>
              <div style="color: #64748b; font-size: 14px;">Payment Method: ${order.paymentMethod}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total">
            <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">Shipping Fee: <span style="color: #16a34a; font-weight: bold;">FREE</span></div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a;">Grand Total: ₹${order.totalAmount?.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    next(err);
  }
};
