const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema(
  {
    referralBonusAmount: {
      type: Number,
      default: 500, // ₹500 fixed by admin
      required: true,
      min: 0,
    },
    enrollmentFee: {
      type: Number,
      default: 999, // Store registration enrollment fee fixed by admin
      required: true,
      min: 0,
    },
    planDurationDays: {
      type: Number,
      default: 365, // Time period plan: 365 days / 1 year
      required: true,
      min: 1,
    },
    commissionRatePercent: {
      type: Number,
      default: 10, // 10% platform commission on orders
      required: true,
      min: 0,
      max: 100,
    },
    minWithdrawalAmount: {
      type: Number,
      default: 500,
      min: 0,
    },
    platformName: {
      type: String,
      default: 'Amezon.online Marketplace',
    },
    supportEmail: {
      type: String,
      default: 'support@amezon.online',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    // DeoDap Automated Dropshipping Settings
    deodapProfitMarginPercent: {
      type: Number,
      default: 30, // 30% default profit margin markup on wholesale DeoDap prices
      min: 0,
      max: 500,
    },
    deodapAutoSync: {
      type: Boolean,
      default: true,
    },
    deodapLastSyncAt: {
      type: Date,
      default: null,
    },
    deodapTotalSynced: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PlatformSetting', platformSettingSchema);
