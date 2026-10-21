const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Order = require('../models/Order');
const connectDB = require('../config/db');

async function seedCustomer() {
  try {
    console.log('[SeedCustomer] Connecting to MongoDB...');
    await connectDB();

    const email = 'ramarajukoyyalagadda@gmail.com';
    let customer = await User.findOne({ email }).select('+password');

    const defaultAddresses = [
      {
        fullName: 'Ramaraju Koyyalagadda',
        phone: '+91 98765 43210',
        street: 'Flat 402, Royal Palms Heights, Whitefield Main Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560066',
        country: 'India',
        tag: 'Home',
        isDefault: true,
      },
      {
        fullName: 'Ramaraju Koyyalagadda',
        phone: '+91 98765 43210',
        street: 'Tech Park Tower 3, 5th Floor, Electronic City Phase 1',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560100',
        country: 'India',
        tag: 'Work',
        isDefault: false,
      },
    ];

    if (!customer) {
      customer = await User.create({
        name: 'Ramaraju Koyyalagadda',
        email,
        password: 'R@maraju123',
        role: 'customer',
        phone: '+91 98765 43210',
        referralCode: 'RAMARAJU100',
        walletBalance: 2500,
        emailVerified: true,
        address: 'Flat 402, Royal Palms Heights, Whitefield Main Road, Bengaluru, Karnataka - 560066',
        savedAddresses: defaultAddresses,
        preferences: {
          emailNotifications: true,
          smsUpdates: true,
          promoAlerts: true,
        },
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      });
      console.log(' -> Created customer:', email);
    } else {
      customer.name = 'Ramaraju Koyyalagadda';
      customer.password = 'R@maraju123';
      customer.role = 'customer';
      customer.phone = '+91 98765 43210';
      customer.emailVerified = true;
      if (!customer.walletBalance || customer.walletBalance < 1000) customer.walletBalance = 2500;
      if (!customer.savedAddresses || customer.savedAddresses.length === 0) {
        customer.savedAddresses = defaultAddresses;
      }
      customer.address = 'Flat 402, Royal Palms Heights, Whitefield Main Road, Bengaluru, Karnataka - 560066';
      await customer.save();
      console.log(' -> Updated customer credentials and profile:', email);
    }

    // Check if customer already has orders
    const existingOrders = await Order.find({ customer: customer._id });
    if (existingOrders.length === 0) {
      console.log(' -> Seeding sample orders for customer...');
      const products = await Product.find().populate('store');

      if (products.length >= 2) {
        // Order 1: Delivered
        const prod1 = products[0];
        const dateDelivered = new Date(Date.now() - 2 * 86400000);
        await Order.create({
          customer: customer._id,
          items: [
            {
              product: prod1._id,
              title: prod1.title,
              price: prod1.discountPrice || prod1.price,
              quantity: 1,
              image: prod1.images?.[0] || '',
              vendor: prod1.vendor,
              store: prod1.store?._id || prod1.store,
              deliveryStatus: 'Delivered',
              trackingNumber: 'AWB789234112',
              deliveredAt: dateDelivered,
              vendorSettled: true,
            },
          ],
          totalAmount: prod1.discountPrice || prod1.price,
          paymentStatus: 'paid',
          paymentMethod: 'Razorpay',
          razorpayPaymentId: 'pay_live_test_987612',
          shippingAddress: defaultAddresses[0],
          invoiceNumber: `INV-${Date.now() - 200000}-4481`,
          courierName: 'Delhivery Express Logistics',
          trackingNumber: 'AWB789234112',
          estimatedDelivery: dateDelivered,
          createdAt: new Date(Date.now() - 5 * 86400000),
          trackingTimeline: [
            {
              status: 'Order Placed',
              title: 'Order Placed & Verified',
              description: 'Customer payment received via Razorpay UPI.',
              location: 'Online Payment Gateway',
              timestamp: new Date(Date.now() - 5 * 86400000),
            },
            {
              status: 'Processing',
              title: 'Package Dispatched from Seller',
              description: 'Seller packed the item in tamper-proof bubble mailer.',
              location: 'Bengaluru Fulfillment Center',
              timestamp: new Date(Date.now() - 4 * 86400000),
            },
            {
              status: 'Shipped',
              title: 'In Transit with Delhivery Express',
              description: 'Consignment arrived at Sorting Facility Hub.',
              location: 'Nelamangala Hub, Karnataka',
              timestamp: new Date(Date.now() - 3 * 86400000),
            },
            {
              status: 'Out for Delivery',
              title: 'Out for Delivery Today',
              description: 'Agent Suresh Kumar (+91 98450 12345) out for delivery.',
              location: 'Whitefield Delivery Station',
              timestamp: new Date(Date.now() - 2 * 86400000 + 4 * 3600000),
            },
            {
              status: 'Delivered',
              title: 'Delivered Successfully',
              description: 'Package handed over to recipient with signature confirmation.',
              location: 'Customer Residence Doorstep',
              timestamp: dateDelivered,
            },
          ],
        });

        // Order 2: Shipped / In Transit
        const prod2 = products[1];
        const estDelivery2 = new Date(Date.now() + 2 * 86400000);
        await Order.create({
          customer: customer._id,
          items: [
            {
              product: prod2._id,
              title: prod2.title,
              price: prod2.discountPrice || prod2.price,
              quantity: 1,
              image: prod2.images?.[0] || '',
              vendor: prod2.vendor,
              store: prod2.store?._id || prod2.store,
              deliveryStatus: 'Shipped',
              trackingNumber: 'AWB892110293',
              vendorSettled: false,
            },
          ],
          totalAmount: prod2.discountPrice || prod2.price,
          paymentStatus: 'paid',
          paymentMethod: 'Wallet',
          shippingAddress: defaultAddresses[0],
          invoiceNumber: `INV-${Date.now() - 80000}-7812`,
          courierName: 'BlueDart Air Express',
          trackingNumber: 'AWB892110293',
          estimatedDelivery: estDelivery2,
          createdAt: new Date(Date.now() - 24 * 3600000),
          trackingTimeline: [
            {
              status: 'Order Placed',
              title: 'Order Paid with Amezon Wallet',
              description: 'Instant wallet deduction confirmed. Order created.',
              location: 'Amezon Wallet Ledger System',
              timestamp: new Date(Date.now() - 24 * 3600000),
            },
            {
              status: 'Processing',
              title: 'Packed & Invoiced by Merchant',
              description: 'Item inspected and handed to BlueDart courier executive.',
              location: 'Mumbai Tech Merchant Warehouse',
              timestamp: new Date(Date.now() - 16 * 3600000),
            },
            {
              status: 'Shipped',
              title: 'Air Shipment In Flight',
              description: 'Package departed Mumbai Airport on Flight BD-402 to Bengaluru.',
              location: 'BOM Cargo Terminal, Mumbai',
              timestamp: new Date(Date.now() - 6 * 3600000),
            },
          ],
        });

        console.log(' -> Seeded 2 orders with rich tracking history for customer!');
      }
    }

    console.log('[SeedCustomer] Complete! Customer ready with email: ' + email + ' / R@maraju123');
    process.exit(0);
  } catch (err) {
    console.error('[SeedCustomer] Error:', err);
    process.exit(1);
  }
}

seedCustomer();
