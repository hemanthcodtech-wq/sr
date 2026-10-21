const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide plan title'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide plan price'],
      min: 0,
    },
    durationDays: {
      type: Number,
      required: [true, 'Please provide duration in days'],
      min: 1,
    },
    description: {
      type: String,
      default: '',
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    productLimit: {
      type: Number,
      default: 50,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    badge: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Plan', planSchema);
