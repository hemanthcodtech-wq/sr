const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
    default: '',
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
  deliveryStatus: {
    type: String,
    enum: ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Processing',
  },
  trackingNumber: {
    type: String,
    default: '',
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  vendorSettled: {
    type: Boolean,
    default: false,
  },
  // Dropshipping source & fulfillment tracking
  isDropshipped: {
    type: Boolean,
    default: false,
  },
  sourcePlatform: {
    type: String,
    enum: ['in_house', 'amazon', 'flipkart', 'meesho', 'deodap', 'other'],
    default: 'in_house',
  },
  sourceUrl: {
    type: String,
    default: '',
  },
  sourcePrice: {
    type: Number,
    default: 0,
  },
  profitMargin: {
    type: Number,
    default: 0,
  },
  sourceOrderId: {
    type: String,
    default: '',
  },
  sourceTrackingNumber: {
    type: String,
    default: '',
  },
  fulfillmentStatus: {
    type: String,
    enum: ['unfulfilled', 'ordered_on_source', 'shipped_by_source', 'delivered_to_customer'],
    default: 'unfulfilled',
  },
  commissionEarned: {
    type: Number,
    default: 0,
  },
  // Vendor Affiliate Promotion (50/50 profit margin split)
  promotedByVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  promotedByStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    default: null,
  },
  isAffiliateSale: {
    type: Boolean,
    default: false,
  },
  vendorProfitShare: {
    type: Number,
    default: 0,
  },
  adminProfitShare: {
    type: Number,
    default: 0,
  },
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'paid',
    },
    paymentMethod: {
      type: String,
      default: 'Razorpay',
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    invoiceNumber: {
      type: String,
      unique: true,
    },
    invoiceUrl: {
      type: String,
      default: '',
    },
    courierName: {
      type: String,
      default: 'Delhivery Express Logistics',
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    trackingTimeline: [
      {
        status: { type: String, default: 'Order Placed' },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        location: { type: String, default: 'Fulfillment Center' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number before save
orderSchema.pre('save', function () {
  if (!this.invoiceNumber) {
    this.invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
});

module.exports = mongoose.model('Order', orderSchema);
