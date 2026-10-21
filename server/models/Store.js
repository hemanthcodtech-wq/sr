const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: [true, 'Please add a store name'],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80',
    },
    banner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    },
    phone: {
      type: String,
      required: [true, 'Please provide business phone number'],
    },
    email: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    status: {
      type: String,
      enum: ['pending_payment', 'pending_admin_approval', 'approved_pending_payment', 'active', 'rejected', 'suspended'],
      default: 'pending_payment',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    feePaidAt: {
      type: Date,
      default: null,
    },
    paymentDetails: {
      type: Object,
      default: {},
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvalEmailSent: {
      type: Boolean,
      default: false,
    },
    documents: {
      aadhaarNumber: { type: String, default: '' },
      aadhaarDocument: { type: String, default: '' },
      panNumber: { type: String, default: '' },
      panDocument: { type: String, default: '' },
      gstNumber: { type: String, default: '' },
      gstDocument: { type: String, default: '' },
    },
    referralCodeUsed: {
      type: String,
      default: '',
    },
    referralBonusCredited: {
      type: Boolean,
      default: false,
    },
    enrollmentFeePaid: {
      type: Number,
      default: 0,
    },
    activePlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    bankDetails: {
      accountHolder: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      upiId: { type: String, default: '' },
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug before save
storeSchema.pre('save', function () {
  if (this.isModified('storeName') || !this.slug) {
    this.slug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 6);
  }
});

module.exports = mongoose.model('Store', storeSchema);
