const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const WalletTransaction = require('../models/WalletTransaction');
const Settlement = require('../models/Settlement');
const PlatformSetting = require('../models/PlatformSetting');
const Product = require('../models/Product');
const Order = require('../models/Order');
const {
  sendEmail,
  getStoreActivatedEmailTemplate,
  getReferralRewardEmailTemplate,
} = require('../utils/sendEmail');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../config/razorpay');
const {
  mockPlans,
  mockUsers,
  mockStores,
  mockSettlements,
  mockTransactions,
  mockSettings,
} = require('../config/mockStore');

// Helper to get platform setting
const getSetting = async () => {
  if (mongoose.connection.readyState !== 1) return mockSettings;
  let setting = await PlatformSetting.findOne();
  if (!setting) {
    setting = await PlatformSetting.create({
      referralBonusAmount: 500,
      commissionRatePercent: 10,
      minWithdrawalAmount: 500,
    });
  }
  return setting;
};

// @desc    Initiate Razorpay order for vendor plan registration fee
// @route   POST /api/vendors/initiate-plan-payment
// @access  Private (Any authenticated user wanting to be vendor)
exports.initiatePlanPayment = async (req, res, next) => {
  try {
    const { planId } = req.body;

    let plan;
    if (mongoose.connection.readyState !== 1) {
      plan = mockPlans.find((p) => p._id === planId) || mockPlans[0];
    } else {
      plan = await Plan.findById(planId);
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Selected plan not found' });
    }

    const receipt = `rcpt_plan_${Date.now()}`;
    const { isMock, order } = await createRazorpayOrder(plan.price, receipt, {
      userId: req.user._id ? req.user._id.toString() : 'mock_user',
      planId: plan._id.toString(),
      type: 'vendor_plan_subscription',
    });

    res.status(200).json({
      success: true,
      order,
      plan,
      isMock,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit Merchant Registration Form with Documents & Store Details
// @route   POST /api/vendors/submit-application
// @access  Private
exports.submitMerchantApplication = async (req, res, next) => {
  try {
    const {
      ownerName,
      phone,
      alternatePhone,
      storeName,
      category,
      description,
      address,
      documents,
      logo,
      banner,
      bankDetails,
      referralCode,
      planId,
    } = req.body;

    if (!storeName || !phone) {
      return res.status(400).json({ success: false, message: 'Store name and contact phone are required' });
    }

    const existingStore = await (mongoose.connection.readyState === 1
      ? Store.findOne({ vendor: req.user._id })
      : mockStores.find((s) => s.vendor === req.user._id || s.vendor?._id === req.user._id));

    const effectiveAadhaar = documents?.aadhaarNumber || existingStore?.documents?.aadhaarNumber || req.user.aadhaarNumber || '543210987654';
    const effectivePan = documents?.panNumber || existingStore?.documents?.panNumber || req.user.panNumber || 'ABCDE1234F';

    // Resolve selected plan if provided
    let resolvedPlan = null;
    if (planId) {
      if (mongoose.connection.readyState !== 1) {
        resolvedPlan = mockPlans.find((p) => p._id === planId) || null;
      } else {
        try {
          resolvedPlan = await Plan.findById(planId);
        } catch (_) {}
      }
    }

    const storePayload = {
      vendor: req.user._id,
      storeName,
      category: category || 'General',
      description: description || '',
      phone: phone || req.user.phone,
      email: req.user.email,
      address: address || {},
      documents: {
        aadhaarNumber: effectiveAadhaar,
        aadhaarDocument: documents?.aadhaarDocument || existingStore?.documents?.aadhaarDocument || req.user.aadhaarDocument || '',
        panNumber: effectivePan,
        panDocument: documents?.panDocument || existingStore?.documents?.panDocument || req.user.panDocument || '',
        gstNumber: documents?.gstNumber || existingStore?.documents?.gstNumber || '',
        gstDocument: documents?.gstDocument || existingStore?.documents?.gstDocument || '',
      },
      logo: logo || existingStore?.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
      banner: banner || existingStore?.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      bankDetails: bankDetails || existingStore?.bankDetails || {},
      referralCodeUsed: referralCode ? referralCode.trim().toUpperCase() : existingStore?.referralCodeUsed || '',
    };

    if (resolvedPlan) {
      storePayload.activePlan = resolvedPlan._id;
    } else if (existingStore?.activePlan) {
      storePayload.activePlan = existingStore.activePlan._id || existingStore.activePlan;
    }

    if (mongoose.connection.readyState !== 1) {
      let store = mockStores.find((s) => s.vendor === req.user._id || s.vendor?._id === req.user._id);
      if (store) {
        // Keep status as pending_payment if fee hasn't been paid yet
        storePayload.status = (store.enrollmentFeePaid || 0) > 0 ? (store.status || 'pending_admin_approval') : 'pending_payment';
        if (resolvedPlan) storePayload.activePlan = resolvedPlan;
        Object.assign(store, storePayload);
      } else {
        storePayload.status = 'pending_payment';
        storePayload.enrollmentFeePaid = 0;
        if (resolvedPlan) storePayload.activePlan = resolvedPlan;
        store = {
          _id: `store_${Date.now()}`,
          ...storePayload,
          createdAt: new Date(),
        };
        mockStores.unshift(store);
      }

      // Update current mock user
      const currentUser = mockUsers.find((u) => u._id === req.user._id);
      if (currentUser) {
        currentUser.role = 'vendor';
        currentUser.store = store;
        if (ownerName) currentUser.name = ownerName;
        if (phone) currentUser.phone = phone;
      }

      return res.status(200).json({
        success: true,
        message: 'Store details and settlement bank account saved! Please proceed to pay the platform enrollment fee.',
        store,
      });
    }

    // Live MongoDB Branch
    let store = await Store.findOne({ vendor: req.user._id });
    if (store) {
      storePayload.status = (store.enrollmentFeePaid || 0) > 0 ? (store.status || 'pending_admin_approval') : 'pending_payment';
      Object.assign(store, storePayload);
      await store.save();
    } else {
      storePayload.status = 'pending_payment';
      storePayload.enrollmentFeePaid = 0;
      store = await Store.create(storePayload);
    }

    await User.findByIdAndUpdate(req.user._id, {
      role: 'vendor',
      store: store._id,
      name: ownerName || req.user.name,
      phone: phone || req.user.phone,
    });

    res.status(200).json({
      success: true,
      message: 'Store details and settlement bank account saved! Please proceed to pay the platform enrollment fee.',
      store,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Current Merchant Enrollment & Application Status
// @route   GET /api/vendors/enrollment-status
// @access  Private
exports.getEnrollmentStatus = async (req, res, next) => {
  try {
    const settings = await getSetting();
    let enrollmentFee = settings.enrollmentFee || 999;
    let planDurationDays = settings.planDurationDays || 365;

    let activePlans = [];
    if (mongoose.connection.readyState !== 1) {
      activePlans = mockPlans.filter((p) => p.isActive);
    } else {
      activePlans = await Plan.find({ isActive: true }).sort({ price: 1 });
    }

    if (activePlans.length > 0) {
      enrollmentFee = activePlans[0].price;
      planDurationDays = activePlans[0].durationDays;
    }

    if (mongoose.connection.readyState !== 1) {
      let store = mockStores.find((s) => s.vendor === req.user._id || s.vendor?._id === req.user._id);
      if (store && store.activePlan && typeof store.activePlan === 'string') {
        const found = mockPlans.find((p) => p._id === store.activePlan);
        if (found) store.activePlan = found;
      }
      return res.status(200).json({
        success: true,
        hasSubmitted: !!store,
        status: store?.status || 'not_submitted',
        store: store || null,
        activePlans,
        enrollmentFee: store?.activePlan?.price || enrollmentFee,
        planDurationDays: store?.activePlan?.durationDays || planDurationDays,
        isPaid: (store?.enrollmentFeePaid || 0) > 0,
        feePaidAt: store?.feePaidAt || null,
        paymentDetails: store?.paymentDetails || null,
        adminNotes: store?.adminNotes || '',
        approvedAt: store?.approvedAt || null,
        planExpiresAt: store?.planExpiresAt || null,
      });
    }

    const store = await Store.findOne({ vendor: req.user._id }).populate('activePlan');
    res.status(200).json({
      success: true,
      hasSubmitted: !!store,
      status: store ? store.status : 'not_submitted',
      store,
      activePlans,
      enrollmentFee: store?.activePlan?.price || enrollmentFee,
      planDurationDays: store?.activePlan?.durationDays || planDurationDays,
      isPaid: (store?.enrollmentFeePaid || 0) > 0,
      feePaidAt: store?.feePaidAt || null,
      paymentDetails: store?.paymentDetails || null,
      adminNotes: store ? store.adminNotes : '',
      approvedAt: store ? store.approvedAt : null,
      planExpiresAt: store ? store.planExpiresAt : null,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Initiate Enrollment Fee Payment for Selected Admin Plan
// @route   POST /api/vendors/initiate-enrollment-payment
// @access  Private
exports.initiateEnrollmentPayment = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const settings = await getSetting();

    let plan = null;
    if (planId) {
      if (mongoose.connection.readyState !== 1) {
        plan = mockPlans.find((p) => p._id === planId) || null;
      } else {
        try {
          plan = await Plan.findById(planId);
        } catch (_) {}
      }
    }

    // If plan not in body, check if store has activePlan saved
    if (!plan) {
      const existingStore = mongoose.connection.readyState === 1
        ? await Store.findOne({ vendor: req.user._id })
        : mockStores.find((s) => s.vendor === req.user._id || s.vendor?._id === req.user._id);

      if (existingStore && existingStore.activePlan) {
        const storedId = existingStore.activePlan._id || existingStore.activePlan;
        if (mongoose.connection.readyState !== 1) {
          plan = mockPlans.find((p) => p._id === storedId) || null;
        } else {
          try {
            plan = await Plan.findById(storedId);
          } catch (_) {}
        }
      }
    }

    // Fallback to first active plan in system
    if (!plan) {
      if (mongoose.connection.readyState !== 1) {
        plan = mockPlans.find((p) => p.isActive) || mockPlans[0];
      } else {
        plan = await Plan.findOne({ isActive: true }).sort({ price: 1 });
      }
    }

    const enrollmentFee = plan ? plan.price : (settings.enrollmentFee || 999);
    const planDurationDays = plan ? plan.durationDays : (settings.planDurationDays || 365);
    const planTitle = plan ? plan.title : 'Store Enrollment Plan';

    const receipt = `rcpt_enroll_${Date.now()}`;
    const { isMock, order } = await createRazorpayOrder(enrollmentFee, receipt, {
      userId: req.user._id ? req.user._id.toString() : 'mock_vendor',
      type: 'store_enrollment_fee',
      planId: plan ? plan._id.toString() : null,
      planTitle,
      planDurationDays,
    });

    res.status(200).json({
      success: true,
      order,
      amount: enrollmentFee,
      planDurationDays,
      plan,
      isMock,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Enrollment Fee Payment & Submit for Admin Approval
// @route   POST /api/vendors/verify-enrollment-payment
// @access  Private
exports.verifyEnrollmentPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId } = req.body;
    const settings = await getSetting();

    let plan = null;
    if (planId) {
      if (mongoose.connection.readyState !== 1) {
        plan = mockPlans.find((p) => p._id === planId) || null;
      } else {
        try {
          plan = await Plan.findById(planId);
        } catch (_) {}
      }
    }

    // Resolve store
    let store = mongoose.connection.readyState === 1
      ? await Store.findOne({ vendor: req.user._id })
      : mockStores.find((s) => s.vendor === req.user._id || s.vendor?._id === req.user._id);

    if (!plan && store && store.activePlan) {
      const storedId = store.activePlan._id || store.activePlan;
      if (mongoose.connection.readyState !== 1) {
        plan = mockPlans.find((p) => p._id === storedId) || null;
      } else {
        try {
          plan = await Plan.findById(storedId);
        } catch (_) {}
      }
    }

    if (!plan) {
      if (mongoose.connection.readyState !== 1) {
        plan = mockPlans.find((p) => p.isActive) || mockPlans[0];
      } else {
        plan = await Plan.findOne({ isActive: true }).sort({ price: 1 });
      }
    }

    const enrollmentFee = plan ? plan.price : (settings.enrollmentFee || 999);
    const planDurationDays = plan ? plan.durationDays : (settings.planDurationDays || 365);

    const paymentDetails = {
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      razorpaySignature: razorpaySignature || '',
      paidAt: new Date(),
      amount: enrollmentFee,
      planId: plan ? plan._id : null,
      planTitle: plan ? plan.title : 'Store Enrollment Plan',
    };

    if (mongoose.connection.readyState !== 1) {
      if (!store) {
        store = mockStores[0];
      }

      // Update store to pending_admin_approval now that fee is paid
      store.status = 'pending_admin_approval';
      store.enrollmentFeePaid = enrollmentFee;
      store.activePlan = plan || null;
      store.feePaidAt = new Date();
      store.paymentDetails = paymentDetails;
      store.planExpiresAt = new Date(Date.now() + planDurationDays * 86400000);

      const currentUser = mockUsers.find((u) => u._id === req.user._id);
      if (currentUser) {
        currentUser.role = 'vendor';
        currentUser.store = store;
      }

      return res.status(200).json({
        success: true,
        message: 'Enrollment fee paid successfully! Your application has been submitted for Admin approval.',
        store,
        paymentDetails,
      });
    }

    // Live MongoDB Branch
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    store.status = 'pending_admin_approval';
    store.enrollmentFeePaid = enrollmentFee;
    if (plan) store.activePlan = plan._id;
    store.feePaidAt = new Date();
    store.paymentDetails = paymentDetails;
    store.planExpiresAt = new Date(Date.now() + planDurationDays * 86400000);
    await store.save();

    await Subscription.create({
      vendor: req.user._id,
      store: store._id,
      plan: plan ? plan._id : null,
      amountPaid: enrollmentFee,
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      startDate: new Date(),
      endDate: new Date(Date.now() + planDurationDays * 86400000),
      status: 'pending_admin_approval',
      referralCodeUsed: store.referralCodeUsed || null,
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { role: 'vendor', store: store._id },
      { new: true }
    ).populate('store');

    const populatedStore = await Store.findById(store._id).populate('activePlan');

    res.status(200).json({
      success: true,
      message: 'Enrollment fee paid successfully! Your application has been submitted for Admin approval.',
      store: populatedStore,
      user: updatedUser,
      paymentDetails,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register store after paying plan fee & process referral reward (Legacy)
// @route   POST /api/vendors/register-store
// @access  Private
exports.registerStoreWithPlan = async (req, res, next) => {
  try {
    const {
      storeName,
      description,
      category,
      phone,
      email,
      address,
      planId,
      referralCode,
      razorpayOrderId,
      razorpayPaymentId,
      bankDetails,
    } = req.body;

    const planExpiresAt = new Date();
    planExpiresAt.setDate(planExpiresAt.getDate() + 90);

    if (mongoose.connection.readyState !== 1) {
      const plan = mockPlans.find((p) => p._id === planId) || mockPlans[0];
      const newStore = {
        _id: `store_${Date.now()}`,
        vendor: req.user._id,
        storeName,
        description: description || '',
        category: category || 'General',
        phone: phone || req.user.phone,
        email: email || req.user.email,
        address: address || {},
        bankDetails: bankDetails || {},
        activePlan: plan,
        planExpiresAt,
        status: 'approved',
      };
      mockStores.push(newStore);

      // Check referral bonus
      let referralRewarded = false;
      if (referralCode && referralCode.trim() !== '') {
        const referringVendor = mockUsers.find(
          (u) => u.referralCode && u.referralCode.toUpperCase() === referralCode.trim().toUpperCase()
        );
        if (referringVendor) {
          referringVendor.walletBalance = (referringVendor.walletBalance || 0) + mockSettings.referralBonusAmount;
          mockTransactions.unshift({
            _id: `tx_${Date.now()}`,
            vendor: referringVendor._id,
            type: 'referral_bonus',
            amount: mockSettings.referralBonusAmount,
            description: `Referral reward for vendor registration of store "${storeName}"`,
            status: 'completed',
            balanceAfter: referringVendor.walletBalance,
            createdAt: new Date(),
          });
          referralRewarded = true;
        }
      }

      // Update current user
      const currentUser = mockUsers.find((u) => u._id === req.user._id);
      if (currentUser) {
        currentUser.role = 'vendor';
        currentUser.store = newStore;
        if (!currentUser.referralCode) {
          currentUser.referralCode = `VEND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Store successfully registered and plan activated!',
        store: newStore,
        user: currentUser || req.user,
        referralRewarded,
      });
    }

    // Live MongoDB Branch
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    const store = await Store.create({
      vendor: req.user._id,
      storeName,
      description: description || '',
      category: category || 'General',
      phone: phone || req.user.phone,
      email: email || req.user.email,
      address: address || {},
      bankDetails: bankDetails || {},
      activePlan: plan._id,
      planExpiresAt,
      status: 'approved',
    });

    await Subscription.create({
      vendor: req.user._id,
      store: store._id,
      plan: plan._id,
      amountPaid: plan.price,
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      startDate: new Date(),
      endDate: planExpiresAt,
      status: 'active',
      referralCodeUsed: referralCode || null,
    });

    const updateData = {
      role: 'vendor',
      store: store._id,
    };

    if (!req.user.referralCode) {
      updateData.referralCode = `VEND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    let referringVendor = null;
    if (referralCode && referralCode.trim() !== '') {
      referringVendor = await User.findOne({
        referralCode: referralCode.trim().toUpperCase(),
        _id: { $ne: req.user._id },
      });

      if (referringVendor) {
        updateData.referredBy = referringVendor._id;
        const settings = await getSetting();
        const referralAmount = settings.referralBonusAmount || 500;

        referringVendor.walletBalance = (referringVendor.walletBalance || 0) + referralAmount;
        await referringVendor.save();

        await WalletTransaction.create({
          vendor: referringVendor._id,
          type: 'referral_bonus',
          amount: referralAmount,
          description: `Referral reward for vendor registration of store "${storeName}"`,
          referenceId: store._id.toString(),
          status: 'completed',
          balanceAfter: referringVendor.walletBalance,
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).populate('store');

    res.status(201).json({
      success: true,
      message: 'Store successfully registered and plan activated!',
      store,
      user: updatedUser,
      referralRewarded: !!referringVendor,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get vendor's store profile
// @route   GET /api/vendors/my-store
// @access  Private (Vendor)
exports.getVendorStore = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const store = mockStores[0];
      return res.status(200).json({
        success: true,
        store,
        isPlanActive: true,
        daysRemaining: 85,
      });
    }

    let store = await Store.findOne({ vendor: req.user._id }).populate('activePlan');
    if (!store && req.user.store) {
      store = await Store.findById(req.user.store).populate('activePlan');
    }

    if (!store) {
      // Auto-create store for this vendor
      store = await Store.create({
        vendor: req.user._id,
        storeName: `${req.user.name}'s Official Store`,
        category: 'Electronics',
        description: 'Verified merchant store on SR Multi-Vendor Marketplace',
        phone: req.user.phone || '+91 98765 43210',
        email: req.user.email,
        status: 'active',
        planExpiresAt: new Date(Date.now() + 180 * 86400000),
      });
      await User.findByIdAndUpdate(req.user._id, { store: store._id });
    }

    const isPlanActive = store.planExpiresAt && new Date(store.planExpiresAt) > new Date();
    const daysRemaining = store.planExpiresAt
      ? Math.max(0, Math.ceil((new Date(store.planExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
      : 0;

    res.status(200).json({
      success: true,
      store,
      isPlanActive,
      daysRemaining,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update store profile
// @route   PUT /api/vendors/my-store
// @access  Private (Vendor)
exports.updateStore = async (req, res, next) => {
  try {
    const { storeName, description, phone, email, address, logo, banner, bankDetails } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const store = mockStores[0];
      Object.assign(store, { storeName, description, phone, email, address, logo, banner, bankDetails });
      return res.status(200).json({ success: true, store });
    }

    const filter = req.user.store
      ? { $or: [{ vendor: req.user._id }, { _id: req.user.store }] }
      : { vendor: req.user._id };

    const store = await Store.findOneAndUpdate(
      filter,
      { storeName, description, phone, email, address, logo, banner, bankDetails },
      { new: true, runValidators: true }
    ).populate('activePlan');

    res.status(200).json({ success: true, store });
  } catch (err) {
    next(err);
  }
};

// @desc    Get vendor wallet, referral stats & transaction history
// @route   GET /api/vendors/wallet
// @access  Private (Vendor)
exports.getWalletAndReferrals = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const user = mockUsers.find((u) => u._id === req.user._id) || mockUsers[1];
      const referrals = mockUsers.filter((u) => u.referredBy === user._id);
      return res.status(200).json({
        success: true,
        walletBalance: user.walletBalance || 2500,
        referralCode: user.referralCode || 'VEND-ARJUN1',
        referralBonusPerStore: mockSettings.referralBonusAmount,
        totalReferrals: referrals.length,
        referrals,
        transactions: mockTransactions,
      });
    }

    const user = await User.findById(req.user._id);
    const referrals = await User.find({ referredBy: req.user._id })
      .select('name email createdAt store')
      .populate('store', 'storeName logo planExpiresAt');

    const transactions = await WalletTransaction.find({ vendor: req.user._id }).sort({ createdAt: -1 });
    const settings = await getSetting();

    res.status(200).json({
      success: true,
      walletBalance: user.walletBalance || 0,
      referralCode: user.referralCode,
      referralBonusPerStore: settings.referralBonusAmount,
      totalReferrals: referrals.length,
      referrals,
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Vendor requests settlement payout
// @route   POST /api/vendors/request-payout
// @access  Private (Vendor)
exports.requestPayout = async (req, res, next) => {
  try {
    const { amount, bankDetails } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const user = mockUsers.find((u) => u._id === req.user._id) || mockUsers[1];
      user.walletBalance -= Number(amount);
      const newSettlement = {
        _id: `stl_${Date.now()}`,
        vendor: user,
        store: mockStores[0],
        amount: Number(amount),
        status: 'requested',
        bankDetails: bankDetails || mockStores[0].bankDetails,
        createdAt: new Date(),
      };
      mockSettlements.unshift(newSettlement);
      mockTransactions.unshift({
        _id: `tx_${Date.now()}`,
        vendor: user._id,
        type: 'settlement_payout',
        amount: -Number(amount),
        description: `Settlement payout request #${newSettlement._id.substring(0, 8)}`,
        status: 'pending',
        balanceAfter: user.walletBalance,
        createdAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Settlement payout request submitted successfully.',
        settlement: newSettlement,
        remainingBalance: user.walletBalance,
      });
    }

    const user = await User.findById(req.user._id);
    const store = await Store.findOne({ vendor: req.user._id });

    if (!store) {
      return res.status(400).json({ success: false, message: 'Vendor store required' });
    }

    const settings = await getSetting();
    const minPayout = Math.min(settings.minWithdrawalAmount || 50, 50);

    if (!amount || amount < minPayout) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout request is ₹${minPayout}`,
      });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. You have ₹${user.walletBalance}`,
      });
    }

    user.walletBalance -= amount;
    await user.save();

    const settlement = await Settlement.create({
      vendor: user._id,
      store: store._id,
      amount,
      status: 'requested',
      bankDetails: bankDetails || store.bankDetails,
    });

    await WalletTransaction.create({
      vendor: user._id,
      type: 'settlement_payout',
      amount: -amount,
      description: `Settlement payout request #${settlement._id.toString().substring(0, 8)}`,
      referenceId: settlement._id.toString(),
      status: 'pending',
      balanceAfter: user.walletBalance,
    });

    res.status(201).json({
      success: true,
      message: 'Settlement payout request submitted successfully. Admin will process it shortly.',
      settlement,
      remainingBalance: user.walletBalance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all active, non-expired official stores for the public panel
// @route   GET /api/vendors/public-stores
// @access  Public
exports.getPublicStores = async (req, res, next) => {
  try {
    const now = new Date();

    if (mongoose.connection.readyState !== 1) {
      const activeStores = mockStores
        .filter((s) => (s.status === 'active' || s.status === 'approved') && (!s.planExpiresAt || new Date(s.planExpiresAt) > now))
        .map((s) => {
          const productCount = (mockProducts || []).filter(
            (p) => (p.store === s._id || p.store?._id === s._id)
          ).length;
          return {
            ...s,
            productCount,
          };
        });

      return res.status(200).json({
        success: true,
        count: activeStores.length,
        stores: activeStores,
      });
    }

    // Live MongoDB Branch
    const stores = await Store.find({
      status: 'active',
      $or: [
        { planExpiresAt: { $exists: false } },
        { planExpiresAt: null },
        { planExpiresAt: { $gt: now } },
      ],
    })
      .select('storeName slug description category logo banner phone email address rating numReviews planExpiresAt createdAt')
      .sort({ rating: -1, createdAt: -1 })
      .lean();

    // Attach product count for each active store
    const storeIds = stores.map((s) => s._id);
    const productCounts = await Product.aggregate([
      { $match: { store: { $in: storeIds } } },
      { $group: { _id: '$store', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    productCounts.forEach((pc) => {
      countMap[pc._id.toString()] = pc.count;
    });

    const enrichedStores = stores.map((s) => ({
      ...s,
      productCount: countMap[s._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      count: enrichedStores.length,
      stores: enrichedStores,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single public store profile and all its active products
// @route   GET /api/vendors/public-stores/:idOrSlug
// @access  Public
exports.getPublicStoreByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const now = new Date();

    if (mongoose.connection.readyState !== 1) {
      const store = mockStores.find((s) => s._id === idOrSlug || s.slug === idOrSlug);
      if (!store || (store.status !== 'active' && store.status !== 'approved')) {
        return res.status(404).json({ success: false, message: 'Official store not found or currently inactive.' });
      }

      if (store.planExpiresAt && new Date(store.planExpiresAt) <= now) {
        return res.status(403).json({
          success: false,
          isExpired: true,
          message: 'This store subscription has expired and is temporarily hidden.',
        });
      }

      const products = (mockProducts || []).filter((p) => p.store === store._id || p.store?._id === store._id);
      return res.status(200).json({
        success: true,
        store,
        products,
      });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId
      ? { _id: idOrSlug, status: 'active' }
      : { slug: idOrSlug, status: 'active' };

    const store = await Store.findOne(query).populate('vendor', 'name email phone avatar');

    if (!store) {
      return res.status(404).json({ success: false, message: 'Official store not found or currently inactive.' });
    }

    if (store.planExpiresAt && new Date(store.planExpiresAt) <= now) {
      return res.status(403).json({
        success: false,
        isExpired: true,
        message: 'This store subscription has expired and is temporarily hidden from the public panel.',
      });
    }

    const products = await Product.find({ store: store._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      store,
      products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Vendor renews their store subscription plan
// @route   POST /api/vendors/renew-plan
// @access  Private (Vendor / Admin)
exports.renewPlanSubscription = async (req, res, next) => {
  try {
    const { planId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'Please select a plan to renew' });
    }

    let plan;
    if (mongoose.connection.readyState !== 1) {
      plan = mockPlans.find((p) => p._id === planId) || mockPlans[0];
    } else {
      plan = await Plan.findById(planId);
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Selected plan not found' });
    }

    const planDurationDays = plan.durationDays || 90;
    const renewalFee = plan.price;

    let store = mongoose.connection.readyState === 1
      ? await Store.findOne({ vendor: req.user._id })
      : mockStores.find((s) => s.vendor === req.user._id || s.vendor?._id === req.user._id);

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found for this account' });
    }

    const now = new Date();
    let currentExpires = store.planExpiresAt ? new Date(store.planExpiresAt) : now;
    // If already expired, start from now; if still valid, extend from current expiry date
    const baseDate = currentExpires > now ? currentExpires : now;
    const newExpiresAt = new Date(baseDate.getTime() + planDurationDays * 86400000);

    const paymentDetails = {
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      razorpaySignature: razorpaySignature || '',
      paidAt: now,
      amount: renewalFee,
      planId: plan._id,
      planTitle: plan.title,
    };

    if (mongoose.connection.readyState !== 1) {
      store.status = 'active';
      store.activePlan = plan;
      store.planExpiresAt = newExpiresAt;
      store.paymentDetails = paymentDetails;

      return res.status(200).json({
        success: true,
        message: `Plan renewed successfully! Your store is active until ${newExpiresAt.toLocaleDateString('en-IN')}`,
        store,
        daysRemaining: Math.ceil((newExpiresAt - now) / 86400000),
      });
    }

    // Live MongoDB Branch
    store.status = 'active';
    store.activePlan = plan._id;
    store.planExpiresAt = newExpiresAt;
    store.paymentDetails = paymentDetails;
    await store.save();

    await Subscription.create({
      vendor: req.user._id,
      store: store._id,
      plan: plan._id,
      amountPaid: renewalFee,
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      startDate: now,
      endDate: newExpiresAt,
      status: 'active',
    });

    const populatedStore = await Store.findById(store._id).populate('activePlan');

    res.status(200).json({
      success: true,
      message: `Plan renewed successfully! Your store is active until ${newExpiresAt.toLocaleDateString('en-IN')}`,
      store: populatedStore,
      daysRemaining: Math.ceil((newExpiresAt - now) / 86400000),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get real-time vendor metrics and analytics from database
// @route   GET /api/vendors/analytics
// @access  Private (Vendor)
exports.getVendorAnalytics = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const Product = require('../models/Product');

    const vendorId = req.user._id;

    // 1. Get live vendor products
    const products = await Product.find({ vendor: vendorId }).select('title price countInStock category isFeatured rating numReviews createdAt');
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.countInStock || 0), 0);
    const featuredProductsCount = products.filter((p) => p.isFeatured).length;

    // 2. Get live orders containing vendor items
    const orders = await Order.find({ 'items.vendor': vendorId }).sort({ createdAt: -1 });

    let totalSales = 0;
    let deliveredOrdersCount = 0;
    let pendingOrdersCount = 0;
    let processingCount = 0;
    let shippedCount = 0;
    const recentOrders = [];

    // Daily revenue accumulation for last 7 days
    const daysMap = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayLabel = dayNames[d.getDay()];
      daysMap[key] = { key, day: dayLabel, sales: 0, earnings: 0, orderCount: 0 };
    }

    orders.forEach((order) => {
      const vendorItems = (order.items || []).filter(
        (item) => item.vendor && item.vendor.toString() === vendorId.toString()
      );

      const orderVendorSubtotal = vendorItems.reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
        0
      );

      totalSales += orderVendorSubtotal;

      const allDelivered = vendorItems.every((i) => i.deliveryStatus === 'Delivered');
      const anyShipped = vendorItems.some((i) => i.deliveryStatus === 'Shipped' || i.deliveryStatus === 'Out for Delivery');
      const anyProcessing = vendorItems.some((i) => i.deliveryStatus === 'Processing');

      if (allDelivered && vendorItems.length > 0) deliveredOrdersCount++;
      else if (anyShipped) shippedCount++;
      else if (anyProcessing) processingCount++;

      if (!allDelivered) pendingOrdersCount++;

      // Chart aggregation
      const orderDateKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (daysMap[orderDateKey]) {
        daysMap[orderDateKey].sales += orderVendorSubtotal;
        daysMap[orderDateKey].earnings += Math.round(orderVendorSubtotal * 0.9);
        daysMap[orderDateKey].orderCount += 1;
      }

      if (recentOrders.length < 5 && vendorItems.length > 0) {
        recentOrders.push({
          _id: order._id,
          invoiceNumber: order.invoiceNumber,
          createdAt: order.createdAt,
          subtotal: orderVendorSubtotal,
          firstItemTitle: vendorItems[0]?.title || 'Product Item',
          firstItemImage: vendorItems[0]?.image || '',
          deliveryStatus: vendorItems[0]?.deliveryStatus || 'Processing',
          customerName: order.shippingAddress?.fullName || 'Customer',
          customerCity: order.shippingAddress?.city || '',
          customerState: order.shippingAddress?.state || '',
        });
      }
    });

    const settings = await getSetting();
    const commissionPercent = settings?.commissionRatePercent || 10;
    const myEarnings = Math.round(totalSales * ((100 - commissionPercent) / 100));

    // Get live vendor referrals count
    const referrals = await User.find({ referredBy: vendorId }).select('name email createdAt');
    const referralBonusEarned = referrals.length * (settings?.referralBonusAmount || 200);

    const weeklyChart = Object.values(daysMap);

    res.status(200).json({
      success: true,
      stats: {
        totalSales,
        myEarnings,
        walletBalance: req.user.walletBalance || 0,
        totalProducts,
        totalStock,
        featuredProductsCount,
        totalOrders: orders.length,
        deliveredOrdersCount,
        pendingOrdersCount,
        processingCount,
        shippedCount,
        totalReferrals: referrals.length,
        referralBonusEarned,
        referralBonusPerStore: settings?.referralBonusAmount || 200,
        weeklyChart,
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get admin dropshipped products available for vendor promotion with 50/50 profit margin split
// @route   GET /api/vendors/dropship-promotions
// @access  Private (Vendor / Admin)
exports.getDropshipPromotions = async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    let products = [];

    if (mongoose.connection.readyState === 1) {
      products = await Product.find({
        $or: [
          { isDropshipped: true },
          { sourcePlatform: { $in: ['amazon', 'flipkart', 'meesho', 'deodap', 'other'] } },
        ],
      })
        .populate('store', 'storeName logo')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      products = mockProducts.filter(
        (p) => p.isDropshipped || ['amazon', 'flipkart', 'meesho', 'deodap'].includes(p.sourcePlatform)
      );
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const mapped = products.map((p) => {
      const sellingPrice = p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;
      const sourcePrice = p.sourcePrice || 0;
      const totalMargin = sourcePrice > 0 ? Math.max(0, sellingPrice - sourcePrice) : 0;
      const vendorShare50 = Math.round(totalMargin * 0.5);
      const adminShare50 = totalMargin - vendorShare50;

      return {
        _id: p._id,
        title: p.title,
        images: p.images || [],
        category: p.category,
        price: p.price,
        discountPrice: p.discountPrice,
        sellingPrice,
        sourcePrice,
        sourcePlatform: p.sourcePlatform || 'deodap',
        sourceUrl: p.sourceUrl || '',
        totalMargin,
        vendorShare50,
        adminShare50,
        stock: p.stock,
        rating: p.rating || 4.8,
        promoLink: `${clientUrl}/products/${p._id}?refVendor=${vendorId}`,
      };
    });

    res.status(200).json({
      success: true,
      count: mapped.length,
      products: mapped,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get vendor's affiliate promotion performance and earned 50% profits
// @route   GET /api/vendors/my-promotions-stats
// @access  Private (Vendor)
exports.getMyPromotionStats = async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    let totalSalesCount = 0;
    let totalProfitEarned = 0;
    let promotedOrders = [];

    if (mongoose.connection.readyState === 1) {
      const orders = await Order.find({ 'items.promotedByVendor': vendorId })
        .populate('customer', 'name email phone avatar')
        .sort({ createdAt: -1 })
        .lean();

      orders.forEach((ord) => {
        const myItems = (ord.items || []).filter(
          (i) => i.promotedByVendor && i.promotedByVendor.toString() === vendorId.toString()
        );

        myItems.forEach((item) => {
          totalSalesCount += item.quantity || 1;
          const share = item.vendorProfitShare || Math.round((item.profitMargin || 0) * 0.5);
          totalProfitEarned += share;

          promotedOrders.push({
            orderId: ord._id,
            invoiceNumber: ord.invoiceNumber,
            date: ord.createdAt,
            customerName: ord.customer?.name || ord.shippingAddress?.fullName || 'Customer',
            productTitle: item.title,
            productImage: item.image,
            sellingPrice: item.price,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
            profitMargin: item.profitMargin || 0,
            vendorProfitShare: share,
            deliveryStatus: item.deliveryStatus || 'Processing',
            paymentStatus: ord.paymentStatus,
          });
        });
      });
    }

    res.status(200).json({
      success: true,
      totalSalesCount,
      totalProfitEarned,
      promotedOrders,
      walletBalance: req.user.walletBalance || 0,
    });
  } catch (err) {
    next(err);
  }
};


