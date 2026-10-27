const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Coupon = require('../models/Coupon');
const jwt = require('jsonwebtoken');
const { mockUsers, mockStores } = require('../config/mockStore');
const { uploadToCloudinary } = require('../config/cloudinary');

// Helper to generate JWT token
const sendTokenResponse = (user, statusCode, res, extraData = {}) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      referralCode: user.referralCode,
      walletBalance: user.walletBalance,
      address: user.address || '',
      savedAddresses: user.savedAddresses || [],
      preferences: user.preferences || { emailNotifications: true, smsUpdates: true, promoAlerts: false },
      store: user.store,
      emailVerified: user.emailVerified || false,
      documentUrl: user.documentUrl || user.panDocument || user.aadhaarDocument || '',
      documentType: user.documentType || '',
      documentOriginalName: user.documentOriginalName || '',
      aadhaarNumber: user.aadhaarNumber || '',
      aadhaarDocument: user.aadhaarDocument || '',
      panNumber: user.panNumber || '',
      panDocument: user.panDocument || '',
    },
    ...extraData,
  });
};

const { sendEmail, getOtpEmailTemplate } = require('../utils/sendEmail');

// In-memory OTP storage for rapid verification & mock fallback
const otpStore = new Map();

// @desc    Send 6-Digit Email Verification OTP
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email.toLowerCase(), { otp, expiresAt, verified: false });

    // In live DB mode, also save to User record if user already exists
    if (mongoose.connection.readyState === 1) {
      await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { emailOtp: otp, emailOtpExpires: new Date(expiresAt) }
      );
    }

    console.log(`[Amezon Auth] OTP for ${email}: ${otp}`);

    // Send email via Nodemailer App Password Connection
    let emailSent = false;
    let mailErrorMessage = '';
    try {
      const emailResult = await sendEmail({
        to: email.toLowerCase(),
        subject: `Your Amezon.online Verification Code: ${otp}`,
        text: `Your 6-digit verification code is: ${otp}. It expires in 10 minutes.`,
        html: getOtpEmailTemplate(otp, email.toLowerCase()),
      });
      emailSent = emailResult?.success === true;
    } catch (mailErr) {
      mailErrorMessage = mailErr.message;
      console.warn(`[Nodemailer Dispatch Note] Could not send live email: ${mailErr.message}`);
    }

    if (!emailSent) {
      console.error(`[Amezon Auth Error] Failed to send email to ${email}: ${mailErrorMessage}`);
      const isBadCreds = mailErrorMessage?.includes('535') || mailErrorMessage?.includes('BadCredentials');

      // In development mode, log OTP to server terminal so developer is aware
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n======================================================`);
        console.log(`[Amezon Auth] Verification OTP for ${email}: ${otp}`);
        console.log(`(Email dispatch status: ${mailErrorMessage})`);
        console.log(`======================================================\n`);
        return res.status(200).json({
          success: true,
          emailSent: false,
          message: isBadCreds
            ? 'Gmail rejected App Password (BadCredentials). Check credentials.'
            : `Verification email failed: ${mailErrorMessage}`,
        });
      }

      return res.status(500).json({
        success: false,
        emailSent: false,
        message: isBadCreds
          ? 'Gmail rejected EMAIL_PASS (BadCredentials / Invalid App Password). Please generate a new 16-character App Password at https://myaccount.google.com/apppasswords.'
          : `Failed to send verification email: ${mailErrorMessage || 'Please verify email configuration'}`,
      });
    }

    res.status(200).json({
      success: true,
      emailSent: true,
      message: `A 6-digit verification code has been dispatched to ${email}`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify 6-Digit Email Verification OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    const record = otpStore.get(email.toLowerCase());
    const isValidMemory = record && record.otp === otp.trim() && record.expiresAt > Date.now();

    let isValidDb = false;
    let verifiedUser = null;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user && ((user.emailOtp === otp.trim() && user.emailOtpExpires > new Date()) || isValidMemory)) {
        isValidDb = true;
        user.emailVerified = true;
        user.emailOtp = null;
        user.emailOtpExpires = null;
        await user.save();
        verifiedUser = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          referralCode: user.referralCode,
          walletBalance: user.walletBalance,
          store: user.store,
          emailVerified: true,
        };
      }
    } else {
      const mockU = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (mockU && isValidMemory) {
        mockU.emailVerified = true;
        verifiedUser = mockU;
      }
    }

    if (!isValidMemory && !isValidDb) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new one.',
      });
    }

    if (record) {
      record.verified = true;
    }

    res.status(200).json({
      success: true,
      message: 'Email address verified successfully!',
      user: verifiedUser,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register new user (Customer or Merchant)
// @desc    Upload document standalone to Cloudinary
// @route   POST /api/auth/upload-document
// @access  Public
exports.uploadDocumentStandalone = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file provided' });
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'amezon_documents',
      req.file.originalname
    );

    res.status(200).json({
      success: true,
      documentUrl: uploadResult.secure_url,
      documentPublicId: uploadResult.public_id,
      documentOriginalName: req.file.originalname,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register new user (Customer or Merchant)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'customer',
      phone,
      referralCode,
      documentType,
      aadhaarNumber,
      panNumber,
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    // Clean numbers
    const cleanAadhaarNumber = aadhaarNumber ? String(aadhaarNumber).replace(/\s/g, '').trim() : '';
    const cleanPanNumber = panNumber ? String(panNumber).trim().toUpperCase() : '';

    // Extract uploaded files from req.files or req.file
    const aadhaarFile = req.files?.aadhaar?.[0] || null;
    const panFile = req.files?.pan?.[0] || null;
    const genericDocFile = req.files?.document?.[0] || req.file || null;
    const avatarFile = req.files?.avatar?.[0] || req.files?.profilePic?.[0] || null;

    // Document Validation: Only Merchants require KYC documents and numbers!
    if (role === 'vendor') {
      if (!cleanAadhaarNumber || cleanAadhaarNumber.length !== 12) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 12-digit Aadhaar Number.',
        });
      }
      if (!cleanPanNumber || cleanPanNumber.length !== 10) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 10-character PAN Number (e.g. ABCDE1234F).',
        });
      }
      if (!aadhaarFile && !req.body.aadhaarDocument) {
        return res.status(400).json({
          success: false,
          message: 'Aadhaar Card document upload is mandatory for Merchant / Seller registration.',
        });
      }
      if (!panFile && !req.body.panDocument) {
        return res.status(400).json({
          success: false,
          message: 'PAN Card document upload is mandatory for Merchant / Seller registration.',
        });
      }
    }

    let aadhaarDocument = req.body.aadhaarDocument || '';
    let aadhaarPublicId = req.body.aadhaarPublicId || '';
    let panDocument = req.body.panDocument || '';
    let panPublicId = req.body.panPublicId || '';
    let documentUrl = req.body.documentUrl || '';
    let documentPublicId = req.body.documentPublicId || '';
    let avatarUrl = req.body.avatar || '';

    // Upload Profile Picture / Avatar if provided during registration
    if (avatarFile) {
      try {
        console.log(`[Amezon Auth] Uploading Profile Picture to Cloudinary: ${avatarFile.originalname} (${avatarFile.size} bytes)`);
        const uploadResult = await uploadToCloudinary(
          avatarFile.buffer,
          'amezon_avatars',
          avatarFile.originalname
        );
        avatarUrl = uploadResult.secure_url || '';
        console.log(`[Amezon Auth] Profile Picture uploaded: ${avatarUrl}`);
      } catch (err) {
        console.warn('[Cloudinary Profile Picture Note]', err.message);
        avatarUrl = `data:${avatarFile.mimetype};base64,${avatarFile.buffer.toString('base64')}`;
      }
    }

    // Upload Aadhaar to Cloudinary
    if (aadhaarFile) {
      try {
        console.log(`[Amezon Auth] Uploading Aadhaar to Cloudinary: ${aadhaarFile.originalname} (${aadhaarFile.size} bytes)`);
        const uploadResult = await uploadToCloudinary(
          aadhaarFile.buffer,
          'amezon_documents',
          aadhaarFile.originalname
        );
        aadhaarDocument = uploadResult.secure_url || '';
        aadhaarPublicId = uploadResult.public_id || '';
        console.log(`[Amezon Auth] Aadhaar uploaded: ${aadhaarDocument}`);
      } catch (err) {
        console.error('[Cloudinary Aadhaar Upload Error]', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload Aadhaar card to Cloudinary: ' + err.message,
        });
      }
    }

    // Upload PAN to Cloudinary
    if (panFile) {
      try {
        console.log(`[Amezon Auth] Uploading PAN to Cloudinary: ${panFile.originalname} (${panFile.size} bytes)`);
        const uploadResult = await uploadToCloudinary(
          panFile.buffer,
          'amezon_documents',
          panFile.originalname
        );
        panDocument = uploadResult.secure_url || '';
        panPublicId = uploadResult.public_id || '';
        console.log(`[Amezon Auth] PAN uploaded: ${panDocument}`);
      } catch (err) {
        console.error('[Cloudinary PAN Upload Error]', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload PAN card to Cloudinary: ' + err.message,
        });
      }
    }

    // Fallback or generic document
    if (genericDocFile && !documentUrl) {
      try {
        const uploadResult = await uploadToCloudinary(
          genericDocFile.buffer,
          'amezon_documents',
          genericDocFile.originalname
        );
        documentUrl = uploadResult.secure_url || '';
        documentPublicId = uploadResult.public_id || '';
      } catch (cloudErr) {
        console.warn('[Cloudinary generic doc upload note]', cloudErr.message);
      }
    }

    // Primary document URL reference
    if (!documentUrl) {
      documentUrl = panDocument || aadhaarDocument || '';
    }

    const myReferralCode =
      role === 'vendor'
        ? `VEND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        : `CUST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Check if email was OTP-verified
    const otpRecord = otpStore.get(email.toLowerCase());
    const isEmailVerified = otpRecord?.verified === true;

    // Check in-memory mock fallback
    if (mongoose.connection.readyState !== 1) {
      const exists = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      // Check referral code
      let referredBy = null;
      if (referralCode && referralCode.trim()) {
        const referrer = mockUsers.find(
          (u) => u.referralCode && u.referralCode.toUpperCase() === referralCode.trim().toUpperCase()
        );
        if (referrer) {
          referredBy = referrer._id;
        }
      }

      let newStore = null;
      if (role === 'vendor') {
        newStore = {
          _id: `store_${Date.now()}`,
          vendor: `user_${Date.now()}`,
          storeName: req.body.storeName || `${name}'s Official Store`,
          category: 'General',
          description: 'Official verified merchant on Amezon.online',
          phone: phone || '',
          email: email.toLowerCase(),
          documents: {
            aadhaarNumber: cleanAadhaarNumber,
            aadhaarDocument,
            panNumber: cleanPanNumber,
            panDocument,
          },
          referralCodeUsed: referralCode ? referralCode.trim().toUpperCase() : '',
          status: 'pending_payment',
          enrollmentFeePaid: 0,
          createdAt: new Date(),
        };
        mockStores.unshift(newStore);
      }

      const newUser = {
        _id: `user_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        role,
        phone: phone || '',
        referralCode: myReferralCode,
        referredBy,
        walletBalance: 0,
        store: newStore ? newStore._id : null,
        emailVerified: isEmailVerified,
        avatar: avatarUrl || '',
        aadhaarNumber: cleanAadhaarNumber,
        aadhaarDocument,
        aadhaarPublicId,
        panNumber: cleanPanNumber,
        panDocument,
        panPublicId,
        documentUrl,
        documentPublicId,
        documentType: role === 'vendor' ? 'Aadhaar + PAN' : '',
      };
      if (newStore) newStore.vendor = newUser._id;

      let registrationOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      otpStore.set(email.toLowerCase(), { otp: registrationOtp, expiresAt, verified: false });

      sendEmail({
        to: email.toLowerCase(),
        subject: `Your SR Marketplace Verification Code: ${registrationOtp}`,
        text: `Your 6-digit verification code is: ${registrationOtp}. It expires in 10 minutes.`,
        html: getOtpEmailTemplate(registrationOtp, email.toLowerCase()),
      }).catch((mailErr) => {
        console.warn(`[Amezon Auth Note] Email dispatch: ${mailErr.message}`);
      });

      console.log(`\n======================================================`);
      console.log(`[Amezon Auth] OTP for ${role} ${email}: ${registrationOtp}`);
      console.log(`======================================================\n`);

      mockUsers.push(newUser);
      return sendTokenResponse(newUser, 201, res, {
        otpSent: true,
      });
    }

    // Live MongoDB Branch
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    let referredBy = null;
    if (referralCode && referralCode.trim()) {
      const referrer = await User.findOne({
        referralCode: referralCode.trim().toUpperCase(),
      });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone: phone || '',
      avatar: avatarUrl || '',
      referralCode: myReferralCode,
      referredBy,
      emailVerified: isEmailVerified,
      aadhaarNumber: cleanAadhaarNumber,
      aadhaarDocument,
      aadhaarPublicId,
      panNumber: cleanPanNumber,
      panDocument,
      panPublicId,
      documentUrl,
      documentPublicId,
      documentType: role === 'vendor' ? 'Aadhaar + PAN' : '',
    });

    if (role === 'vendor') {
      const store = await Store.create({
        vendor: user._id,
        storeName: req.body.storeName || `${user.name}'s Official Store`,
        category: 'General',
        description: 'Official verified merchant on Amezon.online',
        phone: user.phone || '',
        email: user.email,
        documents: {
          aadhaarNumber: cleanAadhaarNumber,
          aadhaarDocument,
          panNumber: cleanPanNumber,
          panDocument,
        },
        referralCodeUsed: referralCode ? referralCode.trim().toUpperCase() : '',
        status: 'pending_payment',
        enrollmentFeePaid: 0,
      });
      user.store = store._id;
      await user.save();
    }

    let registrationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(email.toLowerCase(), { otp: registrationOtp, expiresAt, verified: false });

    user.emailOtp = registrationOtp;
    user.emailOtpExpires = new Date(expiresAt);
    await user.save();

    // Customer Referral Coupon Awarding: ONLY when referred by another customer
    try {
      if (referredBy) {
        // Find referrer user to fetch their details
        const referrerUser = await User.findById(referredBy);

        // 1. Reward coupon awarded to the REFERRER for referring this customer
        const refSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        await Coupon.create({
          code: `REF200-${refSuffix}`,
          discountType: 'flat',
          discountAmount: 200,
          minOrderAmount: 499,
          assignedTo: referredBy,
          isReferralReward: true,
          referredUser: user._id,
          description: `₹200 Referral Reward! Your friend ${user.name} joined Amezon.online`,
          badge: 'Referral Reward',
          isActive: true,
          usageLimit: 1,
        });

        // 2. Welcome bonus voucher for the new friend who registered
        const welcomeSuffix = user._id.toString().slice(-4).toUpperCase();
        await Coupon.create({
          code: `WELCOME100-${welcomeSuffix}`,
          discountType: 'flat',
          discountAmount: 100,
          minOrderAmount: 299,
          assignedTo: user._id,
          isReferralReward: false,
          description: `Welcome ₹100 Gift Voucher for joining via referral invite from ${referrerUser?.name || 'a friend'}!`,
          badge: 'Welcome Gift',
          isActive: true,
          usageLimit: 1,
        });
      }
    } catch (couponErr) {
      console.warn('Coupon creation note on register:', couponErr.message);
    }

    sendEmail({
      to: email.toLowerCase(),
      subject: `Your SR Marketplace Verification Code: ${registrationOtp}`,
      text: `Your 6-digit verification code is: ${registrationOtp}. It expires in 10 minutes.`,
      html: getOtpEmailTemplate(registrationOtp, email.toLowerCase()),
    }).catch((mailErr) => {
      console.warn(`[Amezon Auth Note] Email dispatch: ${mailErr.message}`);
    });

    console.log(`\n======================================================`);
    console.log(`[Amezon Auth] OTP for ${role} ${email}: ${registrationOtp}`);
    console.log(`======================================================\n`);

    sendTokenResponse(user, 201, res, {
      otpSent: true,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    if (mongoose.connection.readyState !== 1) {
      const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      return sendTokenResponse(user, 200, res);
    }

    const user = await User.findOne({ email }).select('+password').populate('store');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const user = mockUsers.find((u) => u._id === req.user.id || u._id === req.user._id);
      return res.status(200).json({ success: true, user: user || req.user });
    }

    const user = await User.findById(req.user.id).populate('store');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    let { name, phone, avatar, address, preferences } = req.body;

    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          'amezon_avatars',
          req.file.originalname
        );
        avatar = uploadResult.secure_url || '';
      } catch (err) {
        avatar = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }
    }

    if (mongoose.connection.readyState !== 1) {
      const user = mockUsers.find((u) => u._id === req.user.id || u._id === req.user._id);
      if (user) {
        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (avatar !== undefined) user.avatar = avatar;
        if (address !== undefined) user.address = address;
        if (preferences !== undefined) user.preferences = { ...user.preferences, ...preferences };
        return res.status(200).json({ success: true, message: 'Profile updated successfully', user });
      }
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (address !== undefined) updateFields.address = address;
    if (preferences !== undefined) updateFields.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user.id || req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('store');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    }

    const user = await User.findById(req.user.id || req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user saved addresses
// @route   GET /api/auth/addresses
// @access  Private
exports.getAddresses = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const user = mockUsers.find((u) => u._id === req.user.id || u._id === req.user._id);
      return res.status(200).json({ success: true, addresses: user?.savedAddresses || [] });
    }

    const user = await User.findById(req.user.id || req.user._id);
    res.status(200).json({
      success: true,
      addresses: user?.savedAddresses || [],
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add new saved address
// @route   POST /api/auth/addresses
// @access  Private
exports.addAddress = async (req, res, next) => {
  try {
    const { fullName, phone, street, city, state, zipCode, country, tag, isDefault } = req.body;

    if (!fullName || !phone || !street || !city || !zipCode) {
      return res.status(400).json({ success: false, message: 'Please provide all required address details' });
    }

    const newAddr = {
      fullName,
      phone,
      street,
      city,
      state: state || '',
      zipCode,
      country: country || 'India',
      tag: tag || 'Home',
      isDefault: isDefault === true,
    };

    if (mongoose.connection.readyState !== 1) {
      const user = mockUsers.find((u) => u._id === req.user.id || u._id === req.user._id);
      if (user) {
        if (!user.savedAddresses) user.savedAddresses = [];
        if (newAddr.isDefault) {
          user.savedAddresses.forEach((a) => (a.isDefault = false));
        }
        newAddr._id = `addr_${Date.now()}`;
        user.savedAddresses.push(newAddr);
        return res.status(201).json({ success: true, message: 'Address saved successfully', addresses: user.savedAddresses });
      }
    }

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (newAddr.isDefault && user.savedAddresses.length > 0) {
      user.savedAddresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    if (user.savedAddresses.length === 0) {
      newAddr.isDefault = true;
    }

    user.savedAddresses.push(newAddr);
    if (!user.address) {
      user.address = `${street}, ${city}, ${state} - ${zipCode}`;
    }
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      addresses: user.savedAddresses,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete saved address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const user = mockUsers.find((u) => u._id === req.user.id || u._id === req.user._id);
      if (user && user.savedAddresses) {
        user.savedAddresses = user.savedAddresses.filter((a) => a._id?.toString() !== addressId);
        return res.status(200).json({ success: true, message: 'Address removed', addresses: user.savedAddresses });
      }
    }

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.savedAddresses = user.savedAddresses.filter((a) => a._id?.toString() !== addressId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address removed successfully',
      addresses: user.savedAddresses,
    });
  } catch (err) {
    next(err);
  }
};

