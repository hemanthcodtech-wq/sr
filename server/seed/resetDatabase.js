const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const Settlement = require('../models/Settlement');
const WalletTransaction = require('../models/WalletTransaction');
const PlatformSetting = require('../models/PlatformSetting');
const Plan = require('../models/Plan');
const connectDB = require('../config/db');

const resetDatabase = async () => {
  try {
    console.log('[Reset DB] Connecting to database...');
    await connectDB();

    console.log('\n--- 1. Cleaning non-admin user collections ---');
    const orderRes = await Order.deleteMany({});
    console.log(`Deleted Orders: ${orderRes.deletedCount}`);

    const productRes = await Product.deleteMany({});
    console.log(`Deleted Products: ${productRes.deletedCount}`);

    const storeRes = await Store.deleteMany({});
    console.log(`Deleted Stores: ${storeRes.deletedCount}`);

    const subRes = await Subscription.deleteMany({});
    console.log(`Deleted Subscriptions: ${subRes.deletedCount}`);

    const settleRes = await Settlement.deleteMany({});
    console.log(`Deleted Settlements: ${settleRes.deletedCount}`);

    const walletRes = await WalletTransaction.deleteMany({});
    console.log(`Deleted Wallet Transactions: ${walletRes.deletedCount}`);

    const planRes = await Plan.deleteMany({});
    console.log(`Deleted Subscription Plans: ${planRes.deletedCount}`);

    console.log('\n--- 2. Cleaning Users (keeping only 1 admin) ---');
    const userDeleteRes = await User.deleteMany({ email: { $ne: 'admin@amazon.com' } });
    console.log(`Deleted other Users: ${userDeleteRes.deletedCount}`);

    // Ensure the single admin user exists and is in pristine condition
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
        walletBalance: 0,
        store: null,
      });
      console.log('Admin user recreated: admin@amazon.com (admin123)');
    } else {
      admin.role = 'admin';
      admin.store = null;
      admin.referredBy = null;
      admin.walletBalance = 0;
      admin.emailVerified = true;
      admin.savedAddresses = [];
      await admin.save();
      console.log('Preserved and cleaned single Admin: admin@amazon.com (role: admin)');
    }

    console.log('\n--- 3. Verifying Platform Settings ---');
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = await PlatformSetting.create({
        referralBonusAmount: 500,
        commissionRatePercent: 10,
        minWithdrawalAmount: 500,
        platformName: 'Amezon Multi-Vendor Marketplace',
        supportEmail: 'support@amezon.online',
      });
      console.log('Initialized Platform Settings');
    } else {
      console.log(`Preserved Platform Settings (${setting.platformName})`);
    }

    console.log('\n--- 4. Final Database Summary ---');
    const finalUsers = await User.find({}, 'name email role');
    console.log(`Total Users in DB: ${finalUsers.length}`);
    finalUsers.forEach(u => console.log(` -> ${u.name} (${u.email}) [Role: ${u.role}]`));

    const counts = {
      stores: await Store.countDocuments(),
      products: await Product.countDocuments(),
      orders: await Order.countDocuments(),
      subscriptions: await Subscription.countDocuments(),
      settlements: await Settlement.countDocuments(),
      walletTransactions: await WalletTransaction.countDocuments(),
      plans: await Plan.countDocuments(),
      platformSettings: await PlatformSetting.countDocuments(),
    };
    console.table(counts);

    console.log('\n[Reset DB] Success! Database now contains only 1 Admin user and essential configurations.');
    process.exit(0);
  } catch (err) {
    console.error('[Reset DB] Error:', err);
    process.exit(1);
  }
};

resetDatabase();
