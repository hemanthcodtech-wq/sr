const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Store = require('../models/Store');
const Plan = require('../models/Plan');
const Product = require('../models/Product');
const PlatformSetting = require('../models/PlatformSetting');
const connectDB = require('../config/db');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB Atlas...');
    await connectDB();

    console.log('[Seed] Seeding platform settings...');
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = await PlatformSetting.create({
        referralBonusAmount: 500, // ₹500 fixed by admin for vendor referrals
        commissionRatePercent: 10, // 10% platform commission on orders
        minWithdrawalAmount: 500,
        platformName: 'Amezon Multi-Vendor Marketplace',
        supportEmail: 'support@amezon.online',
      });
      console.log(' -> Platform settings initialized (Referral Bonus: ₹500, Commission: 10%)');
    }

    console.log('[Seed] Seeding subscription plans...');
    let plans = await Plan.find();
    if (plans.length === 0) {
      const createdPlans = await Plan.insertMany([
        {
          title: 'Starter Merchant',
          price: 999,
          durationDays: 30,
          description: 'Ideal for new sellers launching their digital storefront.',
          productLimit: 25,
          badge: 'Starter',
          features: [
            'Sell up to 25 Products',
            'Full Storefront Customization',
            'Vendor Referral Link & Bonus',
            'Standard Email Support',
            'Real-Time Order Tracking',
          ],
        },
        {
          title: 'Growth Pro Merchant',
          price: 2499,
          durationDays: 90,
          description: 'Best for growing businesses looking for higher reach and product inventory.',
          productLimit: 100,
          badge: 'Popular',
          features: [
            'Sell up to 100 Products',
            'Priority Storefront Placement',
            'Earn ₹500 on Each Vendor Referral',
            'Automated Settlement Payouts',
            'Dedicated Priority Support',
            'Advanced Sales Analytics',
          ],
        },
        {
          title: 'Enterprise Brand Hub',
          price: 7999,
          durationDays: 365,
          description: 'Maximum scale, unlimited products, and top-tier marketplace priority.',
          productLimit: 1000,
          badge: 'Best Value',
          features: [
            'Up to 1,000 Products Catalog',
            '1 Full Year Marketplace Validity',
            'Featured Store Banner Promotion',
            'Express Wallet Settlements',
            '24/7 Account Management',
            '0% Extra Listing Fees',
          ],
        },
      ]);
      plans = createdPlans;
      console.log(` -> Seeded ${createdPlans.length} subscription plans`);
    }

    console.log('[Seed] Seeding Admin user with admin@amazon.com / admin123...');
    let admin = await User.findOne({ email: 'admin@amazon.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Amazon Administrator',
        email: 'admin@amazon.com',
        password: 'admin123',
        role: 'admin',
        phone: '+91 98765 43210',
        referralCode: 'ADMIN-AMAZON',
        emailVerified: true,
      });
      console.log(' -> Admin user created successfully: admin@amazon.com (Pass: admin123)');
    } else {
      admin.password = 'admin123';
      admin.role = 'admin';
      admin.emailVerified = true;
      await admin.save();
      console.log(' -> Admin user updated: admin@amazon.com (Pass: admin123)');
    }

    console.log('[Seed] Seeding Demo Vendors & Products...');
    let vendor1 = await User.findOne({ email: 'techgear@vendor.com' });
    if (!vendor1) {
      vendor1 = await User.create({
        name: 'Arjun Mehta',
        email: 'techgear@vendor.com',
        password: 'VendorPassword123!',
        role: 'vendor',
        phone: '+91 98200 11223',
        referralCode: 'VEND-ARJUN1',
        walletBalance: 1500,
        emailVerified: true,
      });

      const storeExpiresAt = new Date();
      storeExpiresAt.setDate(storeExpiresAt.getDate() + 90);

      const store1 = await Store.create({
        vendor: vendor1._id,
        storeName: 'TechGear Official',
        description: 'Premium electronics, noise-cancelling audio gear, and lifestyle tech gadgets.',
        category: 'Electronics',
        phone: '+91 98200 11223',
        email: 'techgear@vendor.com',
        logo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&auto=format&fit=crop&q=80',
        activePlan: plans[1]._id,
        planExpiresAt: storeExpiresAt,
        bankDetails: {
          accountHolder: 'Arjun Mehta',
          accountNumber: '918237465012',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          upiId: 'arjun@hdfcbank',
        },
      });

      vendor1.store = store1._id;
      await vendor1.save();

      // Seed products for TechGear
      await Product.insertMany([
        {
          title: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
          description: 'Industry-leading noise canceling with two processors and 8 microphones. Up to 30-hour battery life with quick charging.',
          price: 29990,
          discountPrice: 26990,
          category: 'Electronics',
          stock: 35,
          images: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
          ],
          rating: 4.9,
          numReviews: 84,
          isFeatured: true,
          tags: ['audio', 'bluetooth', 'headphones', 'sony'],
          vendor: vendor1._id,
          store: store1._id,
        },
        {
          title: 'Mechanical Gaming Keyboard RGB Backlit with Red Switches',
          description: 'Ergonomic compact mechanical keyboard with hot-swappable tactile linear red switches and customizable per-key illumination.',
          price: 4999,
          discountPrice: 3899,
          category: 'Electronics',
          stock: 45,
          images: [
            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
          ],
          rating: 4.7,
          numReviews: 42,
          isFeatured: true,
          tags: ['keyboard', 'gaming', 'rgb'],
          vendor: vendor1._id,
          store: store1._id,
        },
        {
          title: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum',
          description: 'Powerful S9 SiP chip with double-tap gesture, brighter display, and comprehensive health sensors including ECG and blood oxygen.',
          price: 44900,
          discountPrice: 41900,
          category: 'Electronics',
          stock: 20,
          images: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          ],
          rating: 4.8,
          numReviews: 65,
          isFeatured: true,
          tags: ['smartwatch', 'apple', 'fitness'],
          vendor: vendor1._id,
          store: store1._id,
        },
      ]);
      console.log(' -> Seeded Vendor 1 (TechGear Official) and products');
    }

    let vendor2 = await User.findOne({ email: 'urbanstyle@vendor.com' });
    if (!vendor2) {
      vendor2 = await User.create({
        name: 'Priya Sharma',
        email: 'urbanstyle@vendor.com',
        password: 'VendorPassword123!',
        role: 'vendor',
        phone: '+91 98111 22334',
        referralCode: 'VEND-PRIYA2',
        referredBy: vendor1 ? vendor1._id : null,
        walletBalance: 800,
        emailVerified: true,
      });

      const storeExpiresAt2 = new Date();
      storeExpiresAt2.setDate(storeExpiresAt2.getDate() + 365);

      const store2 = await Store.create({
        vendor: vendor2._id,
        storeName: 'UrbanStyle Apparel',
        description: 'Sustainable organic cotton everyday fashion, designer shoes, and handcrafted leather accessories.',
        category: 'Fashion',
        phone: '+91 98111 22334',
        email: 'urbanstyle@vendor.com',
        logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        activePlan: plans[2]._id,
        planExpiresAt: storeExpiresAt2,
        bankDetails: {
          accountHolder: 'Priya Sharma',
          accountNumber: '112233445566',
          ifscCode: 'ICIC0002233',
          bankName: 'ICICI Bank',
          upiId: 'priya@icici',
        },
      });

      vendor2.store = store2._id;
      await vendor2.save();

      // Seed products for UrbanStyle
      await Product.insertMany([
        {
          title: 'Handcrafted Minimalist Italian Leather Backpack',
          description: 'Constructed from full-grain vegetable-tanned leather with water-resistant cotton lining and dedicated 15-inch laptop sleeve.',
          price: 7499,
          discountPrice: 5999,
          category: 'Fashion',
          stock: 28,
          images: [
            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
          ],
          rating: 4.8,
          numReviews: 39,
          isFeatured: true,
          tags: ['leather', 'backpack', 'fashion', 'bags'],
          vendor: vendor2._id,
          store: store2._id,
        },
        {
          title: 'Premium Classic Low-Top White Sneakers',
          description: 'Ultra-cushioned breathable leather sneakers with durable vulcanized rubber soles. Hand-stitched for everyday elegance.',
          price: 3999,
          discountPrice: 3299,
          category: 'Fashion',
          stock: 50,
          images: [
            'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
          ],
          rating: 4.9,
          numReviews: 78,
          isFeatured: true,
          tags: ['shoes', 'sneakers', 'footwear', 'white'],
          vendor: vendor2._id,
          store: store2._id,
        },
        {
          title: '100% Organic Pima Cotton Crewneck T-Shirt (3-Pack)',
          description: 'Breathable, shrink-resistant luxury combed cotton t-shirts in minimalist heather grey, black, and navy.',
          price: 1999,
          discountPrice: 1599,
          category: 'Fashion',
          stock: 80,
          images: [
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          ],
          rating: 4.6,
          numReviews: 95,
          isFeatured: false,
          tags: ['tshirt', 'cotton', 'apparel'],
          vendor: vendor2._id,
          store: store2._id,
        },
      ]);
      console.log(' -> Seeded Vendor 2 (UrbanStyle Apparel) and products');
    }

    console.log('[Seed] Data seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
