const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const connectDB = require('../config/db');

const seedDropship = async () => {
  try {
    console.log('[Dropship Seeder] Connecting to MongoDB...');
    await connectDB();

    // 1. Ensure Admin User
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Marketplace Admin',
        email: 'admin@amazon.com',
        password: 'admin123',
        role: 'admin',
        phone: '+91 98765 43210',
        emailVerified: true,
      });
    }

    // 2. Ensure Official Flagship Store
    let store = await Store.findOne({ slug: 'official-flagship-store' });
    if (!store) {
      store = await Store.create({
        vendor: admin._id,
        storeName: 'Official Flagship Store',
        slug: 'official-flagship-store',
        category: 'General',
        phone: '+91 98765 43210',
        description: 'Official direct multi-channel sourced marketplace catalog.',
        status: 'active',
        enrollmentFeePaid: 999,
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    }

    // 3. Ensure Customer User
    let customer = await User.findOne({ role: 'customer' });
    if (!customer) {
      customer = await User.create({
        name: 'Rahul Sharma',
        email: 'customer@amazon.com',
        password: 'customer123',
        role: 'customer',
        phone: '+91 98111 22334',
        emailVerified: true,
      });
    }

    // 4. Sourced Products from Meesho, DeoDap, Amazon, Flipkart
    const sampleDropshipProducts = [
      {
        title: "Men's Urban Streetwear Oversized Graphic Cotton T-Shirt",
        description: '100% combed cotton, 220 GSM heavyweight luxury fabric with drop shoulder fit. High-density screen print with double-stitched hem.',
        category: 'Fashion',
        sourcePlatform: 'meesho',
        sourceUrl: 'https://www.meesho.com/mens-urban-streetwear-oversized-graphic-cotton-tshirt/p/3b12k',
        sourcePrice: 199,
        price: 499,
        discountPrice: 899,
        stock: 50,
        profitMargin: 300,
        isDropshipped: true,
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
        ],
        vendor: admin._id,
        store: store._id,
      },
      {
        title: 'Multipurpose 900ml Kitchen Magic Vegetable & Fruit Chopper with 5 Stainless Steel Blades',
        description: 'BPA-free plastic body with 5 super-sharp Japanese stainless steel blades. Easy pull cord mechanism for chopping in seconds without electricity.',
        category: 'Home & Kitchen',
        sourcePlatform: 'deodap',
        sourceUrl: 'https://deodap.in/products/stainless-steel-magic-chopper-cutter-900ml',
        sourcePrice: 135,
        price: 369,
        discountPrice: 699,
        stock: 100,
        profitMargin: 234,
        isDropshipped: true,
        images: [
          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80',
        ],
        vendor: admin._id,
        store: store._id,
      },
      {
        title: 'boAt Airdopes 141 True Wireless Earbuds with 42H Playtime & Low Latency Beast Mode',
        description: 'ENx environmental noise cancelling technology with Quad Mics, ASAP Fast Charge (5 min = 75 min playtime), IPX4 water and sweat resistance.',
        category: 'Electronics',
        sourcePlatform: 'amazon',
        sourceUrl: 'https://www.amazon.in/boAt-Airdopes-141-Playtime-Resistance/dp/B09N3ZNHTY',
        sourcePrice: 799,
        price: 1299,
        discountPrice: 2490,
        stock: 40,
        profitMargin: 500,
        isDropshipped: true,
        images: [
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        ],
        vendor: admin._id,
        store: store._id,
      },
      {
        title: 'Smart Health & Fitness Tracker Band with Real-time SpO2, Heart Rate & Sleep Monitor',
        description: '1.47-inch AMOLED color touch display, 14 days battery life on single magnetic charge, 30+ sports modes, 5ATM water resistant up to 50 meters.',
        category: 'Electronics',
        sourcePlatform: 'flipkart',
        sourceUrl: 'https://www.flipkart.com/smart-health-fitness-tracker-band/p/itm19827391',
        sourcePrice: 649,
        price: 1199,
        discountPrice: 1999,
        stock: 35,
        profitMargin: 550,
        isDropshipped: true,
        images: [
          'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
        ],
        vendor: admin._id,
        store: store._id,
      },
    ];

    const createdProds = [];
    for (const p of sampleDropshipProducts) {
      let existing = await Product.findOne({ title: p.title });
      if (!existing) {
        existing = await Product.create(p);
        console.log(`Created dropship product: ${p.title} (${p.sourcePlatform})`);
      }
      createdProds.push(existing);
    }

    // 5. Ensure a sample Customer Dropship Order exists
    let existingOrder = await Order.findOne({ 'items.isDropshipped': true });
    if (!existingOrder && createdProds.length >= 2) {
      const p1 = createdProds[0]; // Meesho T-Shirt
      const p2 = createdProds[1]; // DeoDap Chopper

      await Order.create({
        customer: customer._id,
        items: [
          {
            product: p1._id,
            title: p1.title,
            price: p1.price,
            quantity: 1,
            image: p1.images[0],
            vendor: admin._id,
            store: store._id,
            deliveryStatus: 'Processing',
            trackingNumber: 'AWB984729182',
            vendorSettled: false,
            isDropshipped: true,
            sourcePlatform: 'meesho',
            sourceUrl: p1.sourceUrl,
            sourcePrice: p1.sourcePrice,
            profitMargin: p1.profitMargin,
            fulfillmentStatus: 'unfulfilled',
          },
          {
            product: p2._id,
            title: p2.title,
            price: p2.price,
            quantity: 1,
            image: p2.images[0],
            vendor: admin._id,
            store: store._id,
            deliveryStatus: 'Processing',
            trackingNumber: 'AWB984729183',
            vendorSettled: false,
            isDropshipped: true,
            sourcePlatform: 'deodap',
            sourceUrl: p2.sourceUrl,
            sourcePrice: p2.sourcePrice,
            profitMargin: p2.profitMargin,
            fulfillmentStatus: 'unfulfilled',
          },
        ],
        totalAmount: p1.price + p2.price,
        paymentStatus: 'paid',
        paymentMethod: 'Razorpay',
        razorpayOrderId: 'order_test_9823019',
        razorpayPaymentId: 'pay_test_9823019',
        shippingAddress: {
          fullName: 'Ananya Verma',
          phone: '+91 98760 12345',
          street: 'Flat 402, Lotus Towers, 5th Main Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560038',
          country: 'India',
        },
        courierName: 'Delhivery Express Logistics',
        trackingNumber: 'AWB984729182',
        estimatedDelivery: new Date(Date.now() + 3 * 86400000),
        trackingTimeline: [
          {
            status: 'Order Placed',
            title: 'Payment Confirmed & Order Placed',
            description: 'Customer order received and paid online.',
            location: 'Central Order Processing Facility',
            timestamp: new Date(),
          },
        ],
      });
      console.log('Created sample customer dropship order with Meesho & DeoDap items');
    }

    console.log('[Dropship Seeder] Done successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Dropship Seeder Error]:', err);
    process.exit(1);
  }
};

seedDropship();
