const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a product title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please add product price'],
      min: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Please specify stock quantity'],
      min: 0,
      default: 10,
    },
    images: {
      type: [String],
      validate: [(val) => val.length > 0, 'Please provide at least one product image'],
    },
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
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 12,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Dropshipping & External Sourcing Configuration (Amazon, Flipkart, Meesho, DeoDap)
    sourcePlatform: {
      type: String,
      enum: ['in_house', 'amazon', 'flipkart', 'meesho', 'deodap', 'other'],
      default: 'in_house',
    },
    sourceUrl: {
      type: String,
      default: '',
      trim: true,
    },
    sourcePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryChargeIncluded: {
      type: Number,
      default: 30,
    },
    isFreeDelivery: {
      type: Boolean,
      default: true,
    },
    profitMargin: {
      type: Number,
      default: 0,
    },
    isDropshipped: {
      type: Boolean,
      default: false,
    },
    sku: {
      type: String,
      default: '',
      trim: true,
    },
    deodapProductId: {
      type: String,
      default: '',
      trim: true,
    },
    deodapHandle: {
      type: String,
      default: '',
      trim: true,
    },
    // Complete DeoDap / Shopify CSV attributes
    csvData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    weightGrams: {
      type: Number,
      default: 0,
    },
    barcode: {
      type: String,
      default: '',
    },
    vendorName: {
      type: String,
      default: '',
    },
    productType: {
      type: String,
      default: '',
    },
    seoTitle: {
      type: String,
      default: '',
    },
    seoDescription: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'active',
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        name: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          default: 'Verified Buyer',
        },
        isVerifiedPurchase: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual for discounted savings
productSchema.virtual('discountPercentage').get(function () {
  if (this.discountPrice && this.discountPrice < this.price) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

module.exports = mongoose.model('Product', productSchema);
