const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'vendor', 'admin'],
      default: 'customer',
    },
    phone: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    address: {
      type: String,
      default: '',
    },
    savedAddresses: [
      {
        fullName: { type: String, default: '' },
        phone: { type: String, default: '' },
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        country: { type: String, default: 'India' },
        tag: { type: String, default: 'Home' }, // Home, Work, Other
        isDefault: { type: Boolean, default: false },
      },
    ],
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      smsUpdates: { type: Boolean, default: true },
      promoAlerts: { type: Boolean, default: false },
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailOtp: {
      type: String,
      default: null,
    },
    emailOtpExpires: {
      type: Date,
      default: null,
    },
    documentUrl: {
      type: String,
      default: '',
    },
    documentPublicId: {
      type: String,
      default: '',
    },
    documentType: {
      type: String,
      default: '',
    },
    documentOriginalName: {
      type: String,
      default: '',
    },
    aadhaarNumber: {
      type: String,
      default: '',
    },
    aadhaarDocument: {
      type: String,
      default: '',
    },
    aadhaarPublicId: {
      type: String,
      default: '',
    },
    panNumber: {
      type: String,
      default: '',
    },
    panDocument: {
      type: String,
      default: '',
    },
    panPublicId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
