const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: [true, 'Please specify settlement amount'],
      min: 1,
    },
    status: {
      type: String,
      enum: ['requested', 'approved', 'processing', 'completed', 'rejected'],
      default: 'requested',
    },
    bankDetails: {
      accountHolder: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      upiId: { type: String, default: '' },
    },
    adminNotes: {
      type: String,
      default: '',
    },
    transactionReference: {
      type: String,
      default: '',
    },
    settledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settlement', settlementSchema);
