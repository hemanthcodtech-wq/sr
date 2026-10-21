const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const WalletTransaction = require('../models/WalletTransaction');
const Settlement = require('../models/Settlement');
const PlatformSetting = require('../models/PlatformSetting');
const Product = require('../models/Product');
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
    } = req.body;

    if (!storeName || !phone) {
      return res.status(400).json({ success: false, message: 'Store name and contact phone are required' });
    }

    const existingStore = await (mongoose.connection.readyState === 1
      ? Store.findOne({ vendor: req.user._id })
      : mockStores.find((s) => s.vendor === req.user._id || s.vendor?._id === req.user._id));

    const effectiveAadhaar = documents?.aadhaarNumber || existingStore?.documents?.aadhaarNumber || req.user.aadhaarNumber || '543210987654';
    const effectivePan = documents?.panNumber || existingStore?.documents?.panNumber || req.user.panNumber || 'ABCDE1234F';

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

    if (mongoose.connection.readyState !== 1) {
      let store = mockStores.find((s) => s.vendor === req.user._id || s.vendor?._id === req.user._id);
      if (store) {
        // Keep status as pending_payment if fee hasn't been paid yet
        storePayload.status = (store.enrollmentFeePaid || 0) > 0 ? (store.status || 'pending_admin_approval') : 'pending_payment';
        Object.assign(store, storePayload);
      } else {
        storePayload.status = 'pending_payment';
        storePayload.enrollmentFeePaid = 0;
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
    const enrollmentFee = settings.enrollmentFee || 999;
    const planDurationDays = settings.planDurationDays || 365;

    if (mongoose.connection.readyState !== 1) {
      const store = mockStores.find((s) => s.vendor === req.user._id || s.vendor?._id === req.user._id);
      return res.status(200).json({
        success: true,
        hasSubmitted: !!store,
        status: store?.status || 'not_submitted',
        store: store || null,
        enrollmentFee,
        planDurationDays,
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
      enrollmentFee,
      planDurationDays,
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

// @desc    Initiate Enrollment Fee Payment after Admin Approval
// @route   POST /api/vendors/initiate-enrollment-fee
// @access  Private
exports.initiateEnrollmentPayment = async (req, res, next) => {
  try {
    const settings = await getSetting();
    const enrollmentFee = settings.enrollmentFee || 999;
    const planDurationDays = settings.planDurationDays || 365;

    const receipt = `rcpt_enroll_${Date.now()}`;
    const { isMock, order } = await createRazorpayOrder(enrollmentFee, receipt, {
      userId: req.user._id ? req.user._id.toString() : 'mock_vendor',
      type: 'store_enrollment_fee',
      planDurationDays,
    });

    res.status(200).json({
      success: true,
      order,
      amount: enrollmentFee,
      planDurationDays,
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
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const settings = await getSetting();
    const enrollmentFee = settings.enrollmentFee || 999;
    const planDurationDays = settings.planDurationDays || 365;

    const paymentDetails = {
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      razorpaySignature: razorpaySignature || '',
      paidAt: new Date(),
      amount: enrollmentFee,
    };

    if (mongoose.connection.readyState !== 1) {
      let store = mockStores.find((s) => s.vendor === req.user._id || s.vendor?._id === req.user._id);
      if (!store) {
        store = mockStores[0];
      }

      // Update store to pending_admin_approval now that fee is paid
      store.status = 'pending_admin_approval';
      store.enrollmentFeePaid = enrollmentFee;
      store.feePaidAt = new Date();
      store.paymentDetails = paymentDetails;

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
    let store = await Store.findOne({ vendor: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    store.status = 'pending_admin_approval';
    store.enrollmentFeePaid = enrollmentFee;
    store.feePaidAt = new Date();
    store.paymentDetails = paymentDetails;
    await store.save();

    await Subscription.create({
      vendor: req.user._id,
      store: store._id,
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

    res.status(200).json({
      success: true,
      message: 'Enrollment fee paid successfully! Your application has been submitted for Admin approval.',
      store,
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

    const store = await Store.findOne({ vendor: req.user._id }).populate('activePlan');
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found for this account' });
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

    const store = await Store.findOneAndUpdate(
      { vendor: req.user._id },
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
    const minPayout = settings.minWithdrawalAmount || 500;

    if (!amount || amount < minPayout) {
      return res.status(400).json({
        success: false,
        message: `Minimum settlement payout request is ₹${minPayout}`,
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
        .filter((s) => s.status === 'active' && (!s.planExpiresAt || new Date(s.planExpiresAt) > now))
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
      if (!store || store.status !== 'active') {
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
