const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      enum: ['pending_admin_approval', 'active', 'expired', 'cancelled'],
      default: 'pending_admin_approval',
    },
    referralCodeUsed: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
