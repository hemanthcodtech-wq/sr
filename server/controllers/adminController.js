const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Settlement = require('../models/Settlement');
const PlatformSetting = require('../models/PlatformSetting');
const WalletTransaction = require('../models/WalletTransaction');
const {
  sendEmail,
  getStoreApprovalEmailTemplate,
  getStoreActivatedEmailTemplate,
  getReferralRewardEmailTemplate,
} = require('../utils/sendEmail');
const {
  mockUsers,
  mockStores,
  mockProducts,
  mockOrders,
  mockSettlements,
  mockSettings,
  mockTransactions,
} = require('../config/mockStore');

// Helper to credit referral bonus upon store approval/activation
const creditReferralBonusIfNeeded = async (store, setting) => {
  if (store.referralBonusCredited) return false;
  if (!store.referralCodeUsed) return false;

  const bonusAmount = setting?.referralBonusAmount || 500;

  if (mongoose.connection.readyState !== 1) {
    const referrer = mockUsers.find(
      (u) => u.referralCode && u.referralCode.toUpperCase() === store.referralCodeUsed.toUpperCase()
    );
    if (referrer) {
      referrer.walletBalance = (referrer.walletBalance || 0) + bonusAmount;
      if (Array.isArray(mockTransactions)) {
        mockTransactions.unshift({
          _id: `tx_${Date.now()}`,
          vendor: referrer._id,
          type: 'referral_bonus',
          amount: bonusAmount,
          description: `Referral bonus for store approval: "${store.storeName}"`,
          status: 'completed',
          balanceAfter: referrer.walletBalance,
          createdAt: new Date(),
        });
      }
      store.referralBonusCredited = true;
      return { rewarded: true, referrer, bonusAmount };
    }
    return false;
  }

  const referrer = await User.findOne({
    referralCode: store.referralCodeUsed.toUpperCase(),
    _id: { $ne: store.vendor?._id || store.vendor },
  });

  if (referrer) {
    referrer.walletBalance = (referrer.walletBalance || 0) + bonusAmount;
    await referrer.save();

    await WalletTransaction.create({
      vendor: referrer._id,
      type: 'referral_bonus',
      amount: bonusAmount,
      description: `Referral bonus for store approval: "${store.storeName}"`,
      referenceId: store._id.toString(),
      status: 'completed',
      balanceAfter: referrer.walletBalance,
    });

    store.referralBonusCredited = true;
    await store.save();

    // Send email notification to referrer
    try {
      await sendEmail({
        to: referrer.email,
        subject: `🎉 ₹${bonusAmount} Referral Bonus Credited to Your Amezon.online Wallet!`,
        text: `Congratulations! A merchant you referred ("${store.storeName}") has been approved. ₹${bonusAmount} has been credited to your wallet balance.`,
        html: getReferralRewardEmailTemplate({
          referrerName: referrer.name,
          bonusAmount,
          newWalletBalance: referrer.walletBalance,
          referredStoreName: store.storeName,
        }),
      });
    } catch (e) {
      console.warn('[Referral Email Error]', e.message);
    }

    return { rewarded: true, referrer, bonusAmount };
  }
  return false;
};

// @desc    Get Admin Dashboard KPI metrics
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const dateQuery = {};
    if (dateFrom) dateQuery.$gte = new Date(dateFrom);
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      dateQuery.$lte = toDate;
    }
    const orderFilter = Object.keys(dateQuery).length > 0 ? { createdAt: dateQuery } : {};



    const [
      totalCustomers,
      totalVendors,
      totalProducts,
      allOrders,
      allStores,
      subscriptions,
      pendingSettlements,
      lowStockProducts,
      setting,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'vendor' }),
      Product.countDocuments(),
      Order.find(orderFilter)
        .populate('customer', 'name email avatar phone')
        .populate('items.product', 'title images price')
        .sort({ createdAt: -1 }),
      Store.find(),
      Subscription.find({ status: 'active' }),
      Settlement.find({ status: 'requested' }),
      Product.find().sort({ stock: 1 }).limit(5).populate('store', 'storeName logo'),
      PlatformSetting.findOne(),
    ]);

    const enrollmentFees = allStores.reduce((sum, s) => sum + (s.enrollmentFeePaid || 0), 0);
    const subFees = subscriptions.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    const planRevenue = enrollmentFees + subFees;

    const grossSales = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const commissionPercent = setting ? setting.commissionRatePercent : 10;
    const commissions = Math.round((grossSales * commissionPercent) / 100);
    const totalRevenue = grossSales + planRevenue;
    const netRevenue = grossSales > 0 ? grossSales - commissions : planRevenue;

    const pendingSettlementAmount = pendingSettlements.reduce((sum, s) => sum + (s.amount || 0), 0);

    // Fetch Admin User & Dropship Commission Ledger
    const adminUser = await User.findOne({ role: 'admin' });
    const adminWalletBalance = adminUser?.walletBalance || 0;

    const totalDropshipCommission = allOrders.reduce((sum, o) => {
      return sum + (o.items || []).reduce((iSum, item) => {
        return iSum + (item.isDropshipped ? (item.commissionEarned || item.profitMargin || 0) : 0);
      }, 0);
    }, 0);

    const dropshipOrdersCount = allOrders.filter((o) => (o.items || []).some((i) => i.isDropshipped)).length;

    const commissionTransactions = await WalletTransaction.find({ type: 'dropship_commission' })
      .sort({ createdAt: -1 })
      .limit(10);

    // Compute dynamic daily chart metrics
    const daysCount = 7;
    const chartData = [];
    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOrders = allOrders.filter(
        (o) => new Date(o.createdAt).toISOString().split('T')[0] === dateStr
      );
      const daySales = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const dayCommission = Math.round((daySales * commissionPercent) / 100);
      chartData.push({
        date: dateStr,
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        totalRevenue: daySales,
        netRevenue: daySales - dayCommission,
        commission: dayCommission,
        ordersCount: dayOrders.length,
      });
    }

    // Format recent orders
    const recentOrders = allOrders.slice(0, 10).map((o) => ({
      _id: o._id,
      id: o.invoiceNumber || `#${o._id.toString().slice(-8).toUpperCase()}`,
      customer: o.customer?.name || o.shippingAddress?.fullName || 'Customer',
      email: o.customer?.email || 'N/A',
      phone: o.shippingAddress?.phone || '',
      amount: o.totalAmount,
      payment: `${o.paymentMethod || 'Razorpay'} • ${o.paymentStatus === 'paid' ? 'Completed' : o.paymentStatus || 'Pending'}`,
      status: o.items?.[0]?.deliveryStatus || (o.paymentStatus === 'paid' ? 'Processing' : 'Pending'),
      paymentStatus: o.paymentStatus,
      date: new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: o.createdAt,
    }));

    // Format inventory alerts
    const inventoryAlerts = lowStockProducts.map((p) => ({
      _id: p._id,
      title: p.title,
      price: p.price,
      stock: p.stock,
      category: p.category,
      storeName: p.store?.storeName || 'Merchant Store',
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalVendors,
        totalStores: allStores.length,
        totalProducts,
        totalOrders: allOrders.length,
        grossSales,
        totalRevenue,
        planRevenue,
        commissions,
        netRevenue,
        pendingSettlementAmount,
        pendingSettlementCount: pendingSettlements.length,
        referralBonusAmount: setting ? setting.referralBonusAmount : 500,
        commissionRatePercent: commissionPercent,
        adminWalletBalance,
        totalDropshipCommission,
        dropshipOrdersCount,
      },
      commissionTransactions,
      recentOrders,
      inventoryAlerts,
      chartData,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all vendors with store and plan details
// @route   GET /api/admin/vendors
// @access  Private (Admin)
exports.getAllVendors = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const vendors = mockUsers
        .filter((u) => u.role === 'vendor')
        .filter((u) => {
          const store = mockStores.find((s) => s.vendor === u._id || s.vendor?._id === u._id);
          return store && ((store.enrollmentFeePaid || 0) > 0 || ['active', 'rejected', 'suspended'].includes(store.status));
        });
      return res.status(200).json({ success: true, count: vendors.length, vendors });
    }

    const vendors = await User.find({ role: 'vendor' })
      .populate({
        path: 'store',
        match: {
          $or: [
            { enrollmentFeePaid: { $gt: 0 } },
            { status: { $in: ['active', 'rejected', 'suspended'] } },
          ],
        },
        populate: { path: 'activePlan' },
      })
      .populate('referredBy', 'name email referralCode')
      .sort({ createdAt: -1 });

    // Only return vendors whose store has paid the enrollment fee
    const validVendors = vendors.filter((v) => v.store);

    res.status(200).json({
      success: true,
      count: validVendors.length,
      vendors: validVendors,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get All Merchant Applications for Admin Review
// @route   GET /api/admin/applications
// @access  Private (Admin)
exports.getMerchantApplications = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Exclude stores that haven't paid the enrollment fee yet
      const applications = mockStores
        .filter((s) => (s.enrollmentFeePaid || 0) > 0 || ['active', 'rejected', 'suspended'].includes(s.status))
        .map((s) => {
          const vendorUser = mockUsers.find((u) => u._id === s.vendor || u._id === s.vendor?._id);
          return {
            ...s,
            vendor: vendorUser || s.vendor,
          };
        });
      return res.status(200).json({
        success: true,
        count: applications.length,
        applications,
      });
    }

    // Live MongoDB: Only return applications where enrollment fee has been paid (or active/rejected)
    const applications = await Store.find({
      $or: [
        { enrollmentFeePaid: { $gt: 0 } },
        { status: { $in: ['active', 'rejected', 'suspended'] } },
      ],
    })
      .populate('vendor', 'name email phone avatar createdAt referralCode')
      .populate('activePlan')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get complete details of a specific vendor (Profile Pic, Order Values, Products, Wallet Amount, Settlements & Admin Transactions)
// @route   GET /api/admin/vendors/:storeId/full-details
// @access  Private (Admin)
exports.getVendorFullDetails = async (req, res, next) => {
  try {
    const { storeId } = req.params;

    let store = null;
    let vendorUser = null;

    if (mongoose.Types.ObjectId.isValid(storeId)) {
      store = await Store.findById(storeId).populate('activePlan');
    }
    if (!store) {
      store = await Store.findOne({
        $or: [
          { slug: storeId },
          { slug: storeId.toLowerCase() },
          { storeName: new RegExp(`^${storeId.replace(/[-_]/g, ' ')}$`, 'i') },
          { storeName: new RegExp(`^${storeId}$`, 'i') },
        ],
      }).populate('activePlan');
    }

    if (!store && mongoose.Types.ObjectId.isValid(storeId)) {
      // Try finding by vendor user ID
      vendorUser = await User.findById(storeId);
      if (vendorUser && vendorUser.store) {
        store = await Store.findById(vendorUser.store).populate('activePlan');
      }
    }

    if (!store && !vendorUser) {
      return res.status(404).json({ success: false, message: 'Vendor store not found' });
    }

    if (!vendorUser && store?.vendor) {
      vendorUser = await User.findById(store.vendor);
    }

    const vendorUserId = vendorUser?._id;
    const storeObjId = store?._id;

    // Fetch Products belonging to this vendor/store
    const products = await Product.find({
      $or: [
        { store: storeObjId },
        { vendor: vendorUserId },
      ],
    }).sort({ createdAt: -1 });

    // Fetch Orders containing products from this vendor/store
    const orders = await Order.find({
      $or: [
        { 'items.store': storeObjId },
        { 'items.vendor': vendorUserId },
      ],
    }).sort({ createdAt: -1 });

    // Calculate total order value and store sales share
    let totalSalesValue = 0;
    const vendorOrdersSummary = orders.map((o) => {
      const vendorItems = o.items.filter(
        (i) => (i.store && i.store.toString() === storeObjId?.toString()) ||
               (i.vendor && i.vendor.toString() === vendorUserId?.toString())
      );
      const orderShare = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      totalSalesValue += orderShare;

      return {
        _id: o._id,
        invoiceNumber: o.invoiceNumber,
        createdAt: o.createdAt,
        totalAmount: o.totalAmount,
        orderShare,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        itemsCount: vendorItems.length,
        items: vendorItems,
        customerName: o.shippingAddress?.fullName || 'Customer',
        customerCity: o.shippingAddress?.city || '',
      };
    });

    // Fetch Settlements (admin payouts / transfers made to this vendor)
    const settlements = await Settlement.find({
      $or: [
        { store: storeObjId },
        { vendor: vendorUserId },
      ],
    }).sort({ createdAt: -1 });

    // Fetch Wallet Transactions ledger
    const transactions = await WalletTransaction.find({
      vendor: vendorUserId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      store,
      vendor: vendorUser,
      walletBalance: vendorUser?.walletBalance || 0,
      profilePic: vendorUser?.avatar || store?.logo || '',
      productsCount: products.length,
      products,
      ordersCount: orders.length,
      totalSalesValue,
      orders: vendorOrdersSummary,
      settlements,
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin Review & Approve/Reject Merchant Application
// @route   PUT /api/admin/applications/:storeId/review
// @access  Private (Admin)
exports.reviewMerchantApplication = async (req, res, next) => {
  try {
    const { action, notes } = req.body; // action: 'approve' | 'approve_and_activate' | 'reject'
    const settings = (await PlatformSetting.findOne()) || mockSettings;
    const enrollmentFee = settings.enrollmentFee || 999;
    const planDurationDays = settings.planDurationDays || 365;

    if (!['approve', 'approve_and_activate', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be approve, approve_and_activate, or reject.' });
    }

    if (mongoose.connection.readyState !== 1) {
      const store = mockStores.find((s) => s._id === req.params.storeId);
      if (!store) {
        return res.status(404).json({ success: false, message: 'Store application not found' });
      }

      const isDirectActivate = action === 'approve_and_activate';
      const isAlreadyPaid = (store.enrollmentFeePaid || 0) > 0 || isDirectActivate;
      const isApproveAction = action === 'approve' || isDirectActivate;
      const newStatus = isApproveAction
        ? (isAlreadyPaid ? 'active' : 'approved_pending_payment')
        : 'rejected';

      store.status = newStatus;
      store.adminNotes = notes || (isApproveAction
        ? (isAlreadyPaid
          ? 'KYC documents and payment verified! Store is active.'
          : `Store registration and KYC verified. Approved to pay enrollment fee of ₹${enrollmentFee}.`)
        : 'Document proofs could not be verified.');
      store.approvedAt = isApproveAction ? new Date() : null;
      store.approvalEmailSent = isApproveAction;

      let referralRewarded = false;
      if (isApproveAction && isAlreadyPaid) {
        const effectiveDuration = (store.activePlan && store.activePlan.durationDays) || planDurationDays;
        const planExpiresAt = new Date();
        planExpiresAt.setDate(planExpiresAt.getDate() + effectiveDuration);
        store.planExpiresAt = planExpiresAt;
        const refResult = await creditReferralBonusIfNeeded(store, settings);
        referralRewarded = !!refResult?.rewarded;
      }

      return res.status(200).json({
        success: true,
        message: isApproveAction
          ? (isAlreadyPaid
            ? 'Store approved & activated! Vendor dashboard and public storefront are live.'
            : `Store approved! Notification email sent to vendor to pay platform enrollment fee.`)
          : 'Store registration application rejected.',
        store,
        referralRewarded,
      });
    }

    // Live MongoDB Branch
    const store = await Store.findById(req.params.storeId)
      .populate('vendor', 'name email phone')
      .populate('activePlan');
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store application not found' });
    }

    const effectiveFee = (store.activePlan && store.activePlan.price) || enrollmentFee;
    const effectiveDuration = (store.activePlan && store.activePlan.durationDays) || planDurationDays;

    const isDirectActivate = action === 'approve_and_activate';
    const isAlreadyPaid = (store.enrollmentFeePaid || 0) > 0 || isDirectActivate;
    const isApproveAction = action === 'approve' || isDirectActivate;

    const newStatus = isApproveAction
      ? (isAlreadyPaid ? 'active' : 'approved_pending_payment')
      : 'rejected';

    store.status = newStatus;
    if (isDirectActivate && !store.enrollmentFeePaid) {
      store.enrollmentFeePaid = effectiveFee;
    }

    store.adminNotes = notes || (isApproveAction
      ? (isAlreadyPaid
        ? 'Congratulations! Your store registration, KYC proofs, and access have been approved by admin. Your store is now live!'
        : `Congratulations! Your store registration and KYC documents are approved. Please pay the platform enrollment fee of ₹${effectiveFee} to activate your store.`)
      : 'Application could not be approved at this time. Please check your submitted KYC document proofs.');
    store.approvedAt = isApproveAction ? new Date() : null;
    store.approvalEmailSent = isApproveAction;

    let referralRewarded = false;
    if (isApproveAction) {
      if (isAlreadyPaid) {
        const planExpiresAt = new Date();
        planExpiresAt.setDate(planExpiresAt.getDate() + effectiveDuration);
        store.planExpiresAt = planExpiresAt;

        // Activate any pending subscription
        await Subscription.findOneAndUpdate(
          { store: store._id },
          { status: 'active', startDate: new Date(), endDate: planExpiresAt },
          { sort: { createdAt: -1 } }
        );

        // Credit referral reward if referred
        const refResult = await creditReferralBonusIfNeeded(store, settings);
        referralRewarded = !!refResult?.rewarded;

        // Dispatch Store Live Email
        const vendorEmail = store.email || store.vendor?.email;
        if (vendorEmail) {
          try {
            await sendEmail({
              to: vendorEmail,
              subject: `🎉 Your Store "${store.storeName}" is Officially Live on Amezon.online!`,
              text: `Congratulations! Your store ${store.storeName} is activated. Access your merchant dashboard now.`,
              html: getStoreActivatedEmailTemplate({
                vendorName: store.vendor?.name || 'Merchant',
                storeName: store.storeName,
                planDurationDays,
                planExpiresAt,
                dashboardLink: 'http://localhost:5173/vendor/dashboard',
                publicStoreLink: 'http://localhost:5173/stores',
              }),
            });
          } catch (mErr) {
            console.warn('[Store Activated Email Note]', mErr.message);
          }
        }
      } else {
        // Dispatch Store Approved - Pending Payment Email
        const vendorEmail = store.email || store.vendor?.email;
        if (vendorEmail) {
          try {
            await sendEmail({
              to: vendorEmail,
              subject: `✓ Store Approved! Pay ₹${enrollmentFee} to Activate "${store.storeName}" on Amezon.online`,
              text: `Your merchant KYC documents for ${store.storeName} are approved! Please pay the ₹${enrollmentFee} enrollment fee to activate your store dashboard.`,
              html: getStoreApprovalEmailTemplate({
                vendorName: store.vendor?.name || 'Merchant',
                storeName: store.storeName,
                enrollmentFee,
                planDurationDays,
                loginLink: 'http://localhost:5173/vendor/register',
              }),
            });
          } catch (mErr) {
            console.warn('[Store Approval Email Note]', mErr.message);
          }
        }
      }
    }

    await store.save();

    res.status(200).json({
      success: true,
      message: isApproveAction
        ? (isAlreadyPaid
          ? 'Store approved & activated! Vendor dashboard and storefront are live.'
          : `Store approved! Notification email sent to vendor to pay ₹${enrollmentFee} enrollment fee.`)
        : 'Store registration application rejected.',
      store,
      referralRewarded,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update vendor store status (approved / active / suspended)
// @route   PUT /api/admin/vendors/:storeId/status
// @access  Private (Admin)
exports.updateVendorStatus = async (req, res, next) => {
  try {
    const { status, extendDays, planExpiresAt: newPlanExpiry } = req.body;
    const settings = (await PlatformSetting.findOne()) || mockSettings;
    const planDurationDays = settings.planDurationDays || 365;

    if (mongoose.connection.readyState !== 1) {
      const store = mockStores.find((s) => s._id === req.params.storeId);
      if (store) {
        if (status) store.status = status;
        if (extendDays) {
          const base = store.planExpiresAt && new Date(store.planExpiresAt) > new Date()
            ? new Date(store.planExpiresAt)
            : new Date();
          base.setDate(base.getDate() + Number(extendDays));
          store.planExpiresAt = base;
        } else if (newPlanExpiry) {
          store.planExpiresAt = new Date(newPlanExpiry);
        } else if (status === 'active' && (!store.planExpiresAt || new Date(store.planExpiresAt) <= new Date())) {
          const planExpiresAt = new Date();
          planExpiresAt.setDate(planExpiresAt.getDate() + planDurationDays);
          store.planExpiresAt = planExpiresAt;
          await creditReferralBonusIfNeeded(store, settings);
        }
        return res.status(200).json({ success: true, message: `Status updated successfully`, store });
      }
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const store = await Store.findById(req.params.storeId).populate('vendor', 'name email phone');
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    if (status) store.status = status;

    if (extendDays) {
      const base = store.planExpiresAt && new Date(store.planExpiresAt) > new Date()
        ? new Date(store.planExpiresAt)
        : new Date();
      base.setDate(base.getDate() + Number(extendDays));
      store.planExpiresAt = base;
      if (store.status !== 'active') store.status = 'active';
    } else if (newPlanExpiry) {
      store.planExpiresAt = new Date(newPlanExpiry);
    }

    let referralRewarded = false;
    if (status === 'active') {
      if (!store.planExpiresAt || new Date(store.planExpiresAt) <= new Date()) {
        const planExpiresAt = new Date();
        planExpiresAt.setDate(planExpiresAt.getDate() + planDurationDays);
        store.planExpiresAt = planExpiresAt;
      }

      // Check and credit referral bonus if not yet credited
      const refResult = await creditReferralBonusIfNeeded(store, settings);
      referralRewarded = !!refResult?.rewarded;

      // Dispatch store activated email
      const vendorEmail = store.email || store.vendor?.email;
      if (vendorEmail) {
        try {
          await sendEmail({
            to: vendorEmail,
            subject: `🎉 Your Store "${store.storeName}" is Officially Live on Amezon.online!`,
            text: `Congratulations! Your store ${store.storeName} is activated. Access your merchant dashboard now.`,
            html: getStoreActivatedEmailTemplate({
              vendorName: store.vendor?.name || 'Merchant',
              storeName: store.storeName,
              planDurationDays,
              planExpiresAt: store.planExpiresAt,
              dashboardLink: 'http://localhost:5173/vendor/dashboard',
              publicStoreLink: 'http://localhost:5173/stores',
            }),
          });
        } catch (mErr) {
          console.warn('[Store Activated Email Note]', mErr.message);
        }
      }
    }

    await store.save();

    res.status(200).json({
      success: true,
      message: `Store status updated to ${status}`,
      store,
      referralRewarded,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get platform settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
exports.getPlatformSettings = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, settings: mockSettings });
    }

    let settings = await PlatformSetting.findOne();
    if (!settings) {
      settings = await PlatformSetting.create({
        referralBonusAmount: 500,
        commissionRatePercent: 10,
        minWithdrawalAmount: 500,
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update platform settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
exports.updatePlatformSettings = async (req, res, next) => {
  try {
    const { referralBonusAmount, commissionRatePercent, minWithdrawalAmount, platformName, supportEmail } = req.body;

    if (mongoose.connection.readyState !== 1) {
      if (referralBonusAmount !== undefined) mockSettings.referralBonusAmount = Number(referralBonusAmount);
      if (commissionRatePercent !== undefined) mockSettings.commissionRatePercent = Number(commissionRatePercent);
      if (minWithdrawalAmount !== undefined) mockSettings.minWithdrawalAmount = Number(minWithdrawalAmount);
      if (platformName) mockSettings.platformName = platformName;
      if (supportEmail) mockSettings.supportEmail = supportEmail;

      return res.status(200).json({
        success: true,
        message: 'Platform settings updated successfully',
        settings: mockSettings,
      });
    }

    let settings = await PlatformSetting.findOne();
    if (!settings) {
      settings = new PlatformSetting();
    }

    if (referralBonusAmount !== undefined) settings.referralBonusAmount = Number(referralBonusAmount);
    if (commissionRatePercent !== undefined) settings.commissionRatePercent = Number(commissionRatePercent);
    if (minWithdrawalAmount !== undefined) settings.minWithdrawalAmount = Number(minWithdrawalAmount);
    if (platformName) settings.platformName = platformName;
    if (supportEmail) settings.supportEmail = supportEmail;

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully',
      settings,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin directly settles vendor wallet balance (transfers payout and reduces wallet)
// @route   POST /api/admin/settle-vendor-wallet
// @access  Private (Admin)
exports.settleVendorWallet = async (req, res, next) => {
  try {
    const { vendorId, amount, transactionReference, notes } = req.body;

    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor ID is required' });
    }

    const settleAmount = Number(amount);
    if (!settleAmount || settleAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid settlement amount is required' });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor user not found' });
    }

    if ((vendor.walletBalance || 0) < settleAmount) {
      return res.status(400).json({
        success: false,
        message: `Cannot settle ₹${settleAmount}. Vendor available balance is ₹${vendor.walletBalance || 0}`,
      });
    }

    // Deduct settled amount from vendor's wallet balance
    vendor.walletBalance -= settleAmount;
    await vendor.save();

    const store = await Store.findOne({ vendor: vendor._id });

    // Record completed settlement record
    const settlement = await Settlement.create({
      vendor: vendor._id,
      store: store?._id,
      amount: settleAmount,
      status: 'completed',
      transactionReference: transactionReference || `TXN-ADM-${Date.now()}`,
      adminNotes: notes || 'Direct bank settlement processed by Administrator',
      bankDetails: store?.bankDetails || {},
      settledAt: new Date(),
    });

    // Record ledger transaction
    await WalletTransaction.create({
      vendor: vendor._id,
      type: 'settlement_payout',
      amount: -settleAmount,
      description: `Direct Bank Settlement Disbursement: ₹${settleAmount} (Ref: ${settlement.transactionReference})`,
      referenceId: settlement._id.toString(),
      status: 'completed',
      balanceAfter: vendor.walletBalance,
    });

    res.status(200).json({
      success: true,
      message: `Successfully settled ₹${settleAmount} for ${vendor.name}! Wallet balance reduced to ₹${vendor.walletBalance}.`,
      remainingBalance: vendor.walletBalance,
      settlement,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get detailed Admin Dropship Commission audit ledger
// @route   GET /api/admin/commissions
// @access  Private (Admin)
exports.getAdminCommissionLedger = async (req, res, next) => {
  try {
    let admin = null;
    let transactions = [];
    let totalDropshipCommission = 0;

    if (mongoose.connection.readyState === 1) {
      admin = await User.findOne({ role: 'admin' });
      transactions = await WalletTransaction.find({ type: 'dropship_commission' })
        .sort({ createdAt: -1 })
        .limit(100);

      const orders = await Order.find({ 'items.isDropshipped': true });
      totalDropshipCommission = orders.reduce((sum, o) => {
        return sum + (o.items || []).reduce((iSum, item) => {
          return iSum + (item.isDropshipped ? (item.commissionEarned || item.profitMargin || 0) : 0);
        }, 0);
      }, 0);
    } else {
      admin = mockUsers.find((u) => u.role === 'admin') || mockUsers[0];
      transactions = mockTransactions.filter((t) => t.type === 'dropship_commission');
    }

    res.status(200).json({
      success: true,
      adminWalletBalance: admin?.walletBalance || 0,
      totalDropshipCommission,
      transactionCount: transactions.length,
      transactions,
    });
  } catch (err) {
    next(err);
  }
};
