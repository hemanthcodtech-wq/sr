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
