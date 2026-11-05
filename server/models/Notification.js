const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means broadcast or role-based (e.g. all admins)
    },
    role: {
      type: String,
      enum: ['admin', 'vendor', 'customer', 'all'],
      default: 'customer',
    },
    type: {
      type: String,
      enum: [
        'deodap_order',      // Admin alert: place order in DeoDap software
        'store_order',       // Vendor alert: pack and deliver order to customer
        'vendor_referral',   // Vendor alert: referral bonus credited
        'customer_referral', // Customer alert: referral voucher earned
        'settlement_payout', // Vendor alert: payout processed by admin
        'deodap_affiliate',  // Vendor alert: commission earned on DeoDap product
        'plan_activated',    // Vendor alert: store access unlocked
        'order_status',      // Customer alert: shipment dispatched / delivered
        'system',
      ],
      default: 'system',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
