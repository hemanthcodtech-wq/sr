const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: '',
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    badge: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      required: [true, 'Banner image URL is required'],
      trim: true,
    },
    cloudinaryId: {
      type: String,
      default: '',
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: '/products',
    },
    ctaText: {
      type: String,
      trim: true,
      default: 'Shop Now',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ['gold', 'blue', 'emerald', 'rose', 'dark', 'custom'],
      default: 'gold',
    },
  },
  {
    timestamps: true,
  }
);

bannerSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Banner', bannerSchema);

