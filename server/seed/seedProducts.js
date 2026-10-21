const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Plan = require('../models/Plan');
const connectDB = require('../config/db');

const seedProducts = async () => {
  try {
    console.log('[Product Seeder] Connecting to MongoDB Atlas...');
    await connectDB();

    console.log('[Product Seeder] Ensuring active vendor stores exist...');

    // 1. Ensure a subscription plan exists
    let plan = await Plan.findOne();
    if (!plan) {
      plan = await Plan.create({
        title: 'Enterprise Annual Pass',
        price: 999,
        durationDays: 365,
        description: 'Annual verified merchant membership',
        productLimit: 1000,
        badge: 'Verified Merchant',
        features: ['Unlimited Product Listings', 'Storefront Customization', 'Direct Settlements'],
      });
    }

    const oneYearExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // 2. Vendor 1: TechGear Official (Electronics)
    let vendorElectronics = await User.findOne({ email: 'techgear@vendor.com' });
    if (!vendorElectronics) {
      vendorElectronics = await User.create({
        name: 'Arjun Mehta',
        email: 'techgear@vendor.com',
        password: 'VendorPassword123!',
        role: 'vendor',
        phone: '+91 98200 11223',
        referralCode: 'VEND-ARJUN1',
        walletBalance: 2500,
        emailVerified: true,
        aadhaarNumber: '543210987654',
        panNumber: 'ABCDE1234F',
      });
    }

    let storeElectronics = await Store.findOne({ vendor: vendorElectronics._id });
    if (!storeElectronics) {
      storeElectronics = await Store.create({
        vendor: vendorElectronics._id,
        storeName: 'TechGear Official Store',
        description: 'Authorized retailer of smartphones, laptops, high-fidelity wireless audio, and gaming gear.',
        category: 'Electronics',
        phone: '+91 98200 11223',
        email: 'techgear@vendor.com',
        address: {
          street: 'Shop 22, Cyber Tower Commercial Hub, Main Road',
          city: 'Bhimavaram',
          state: 'Andhra Pradesh',
          zipCode: '534201',
          country: 'India',
        },
        logo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&auto=format&fit=crop&q=80',
        status: 'active',
        enrollmentFeePaid: 999,
        activePlan: plan._id,
        planExpiresAt: oneYearExpiry,
        bankDetails: {
          accountHolder: 'Arjun Mehta',
          accountNumber: '918237465012',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          upiId: 'arjun@hdfcbank',
        },
      });
      vendorElectronics.store = storeElectronics._id;
      await vendorElectronics.save();
    } else {
      storeElectronics.status = 'active';
      storeElectronics.enrollmentFeePaid = 999;
      storeElectronics.planExpiresAt = oneYearExpiry;
      await storeElectronics.save();
    }

    // 3. Vendor 2: Royal Comfort Living (Furniture)
    let vendorFurniture = await User.findOne({ email: 'royalcomfort@vendor.com' });
    if (!vendorFurniture) {
      vendorFurniture = await User.create({
        name: 'Suresh Raju',
        email: 'royalcomfort@vendor.com',
        password: 'VendorPassword123!',
        role: 'vendor',
        phone: '+91 98480 33445',
        referralCode: 'VEND-SURESH',
        walletBalance: 1200,
        emailVerified: true,
        aadhaarNumber: '765432109876',
        panNumber: 'FGHIJ5678K',
      });
    }

    let storeFurniture = await Store.findOne({ vendor: vendorFurniture._id });
    if (!storeFurniture) {
      storeFurniture = await Store.create({
        vendor: vendorFurniture._id,
        storeName: 'Royal Comfort Living & Furniture',
        description: 'Solid Sheesham wood beds, luxury Scandinavian sofas, ergonomic office chairs, and modern dining sets.',
        category: 'Furniture',
        phone: '+91 98480 33445',
        email: 'royalcomfort@vendor.com',
        address: {
          street: 'Furniture Street, Industrial Estate, Someswaram',
          city: 'Bhimavaram',
          state: 'Andhra Pradesh',
          zipCode: '534201',
          country: 'India',
        },
        logo: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80',
        status: 'active',
        enrollmentFeePaid: 999,
        activePlan: plan._id,
        planExpiresAt: oneYearExpiry,
        bankDetails: {
          accountHolder: 'Suresh Raju',
          accountNumber: '445566778899',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          upiId: 'suresh@oksbi',
        },
      });
      vendorFurniture.store = storeFurniture._id;
      await vendorFurniture.save();
    } else {
      storeFurniture.status = 'active';
      storeFurniture.enrollmentFeePaid = 999;
      storeFurniture.planExpiresAt = oneYearExpiry;
      await storeFurniture.save();
    }

    // 4. Vendor 3: GreenLeaf Daily Organics (Grocery)
    let vendorGrocery = await User.findOne({ email: 'greenleaf@vendor.com' });
    if (!vendorGrocery) {
      vendorGrocery = await User.create({
        name: 'Ramesh Varma',
        email: 'greenleaf@vendor.com',
        password: 'VendorPassword123!',
        role: 'vendor',
        phone: '+91 98660 77889',
        referralCode: 'VEND-RAMESH',
        walletBalance: 1800,
        emailVerified: true,
        aadhaarNumber: '987654321098',
        panNumber: 'KLMNO9012P',
      });
    }

    let storeGrocery = await Store.findOne({ vendor: vendorGrocery._id });
    if (!storeGrocery) {
      storeGrocery = await Store.create({
        vendor: vendorGrocery._id,
        storeName: 'GreenLeaf Organics & Daily Staples',
        description: 'Certified organic grains, Himalayan basmati rice, raw forest honey, cold-pressed oils, and farm staples.',
        category: 'Grocery',
        phone: '+91 98660 77889',
        email: 'greenleaf@vendor.com',
        address: {
          street: 'Shop 8, Organic Bazaar Market, Main Town',
          city: 'Bhimavaram',
          state: 'Andhra Pradesh',
          zipCode: '534201',
          country: 'India',
        },
        logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=1200&auto=format&fit=crop&q=80',
        status: 'active',
        enrollmentFeePaid: 999,
        activePlan: plan._id,
        planExpiresAt: oneYearExpiry,
        bankDetails: {
          accountHolder: 'Ramesh Varma',
          accountNumber: '334455667788',
          ifscCode: 'ICIC0001234',
          bankName: 'ICICI Bank',
          upiId: 'ramesh@icici',
        },
      });
      vendorGrocery.store = storeGrocery._id;
      await vendorGrocery.save();
    } else {
      storeGrocery.status = 'active';
      storeGrocery.enrollmentFeePaid = 999;
      storeGrocery.planExpiresAt = oneYearExpiry;
      await storeGrocery.save();
    }

    // 5. Vendor 4: UrbanStyle Fashion Hub (Fashion, Footwear, Accessories)
    let vendorFashion = await User.findOne({ email: 'urbanstyle@vendor.com' });
    if (!vendorFashion) {
      vendorFashion = await User.create({
        name: 'Priya Sharma',
        email: 'urbanstyle@vendor.com',
        password: 'VendorPassword123!',
        role: 'vendor',
        phone: '+91 98111 22334',
        referralCode: 'VEND-PRIYA2',
        walletBalance: 3200,
        emailVerified: true,
        aadhaarNumber: '123456789012',
        panNumber: 'QRSTU3456V',
      });
    }

    let storeFashion = await Store.findOne({ vendor: vendorFashion._id });
    if (!storeFashion) {
      storeFashion = await Store.create({
        vendor: vendorFashion._id,
        storeName: 'UrbanStyle Apparel & Lifestyle',
        description: 'Sustainable organic cotton casuals, designer silk sarees, genuine leather accessories, and footwear.',
        category: 'Fashion',
        phone: '+91 98111 22334',
        email: 'urbanstyle@vendor.com',
        address: {
          street: 'Shop 5, Fashion Street Square, Gandhi Road',
          city: 'Bhimavaram',
          state: 'Andhra Pradesh',
          zipCode: '534201',
          country: 'India',
        },
        logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        status: 'active',
        enrollmentFeePaid: 999,
        activePlan: plan._id,
        planExpiresAt: oneYearExpiry,
        bankDetails: {
          accountHolder: 'Priya Sharma',
          accountNumber: '112233445566',
          ifscCode: 'HDFC0005678',
          bankName: 'HDFC Bank',
          upiId: 'priya@okhdfcbank',
        },
      });
      vendorFashion.store = storeFashion._id;
      await vendorFashion.save();
    } else {
      storeFashion.status = 'active';
      storeFashion.enrollmentFeePaid = 999;
      storeFashion.planExpiresAt = oneYearExpiry;
      await storeFashion.save();
    }

    // 6. Also activate the user's personal store if it exists
    const userStore = await Store.findOne({ email: 'ramarajukoyyalagadda123@gmail.com' });
    if (userStore) {
      userStore.status = 'active';
      userStore.enrollmentFeePaid = 999;
      userStore.planExpiresAt = oneYearExpiry;
      await userStore.save();
      console.log(' -> Activated user store: Rama Raju K\'s Official Store');
    }

    // Clear existing products to avoid duplicates
    console.log('[Product Seeder] Refreshing product catalog...');
    await Product.deleteMany({});

    // 7. Define full catalog of products
    const productsData = [
      // ----------------------------------------------------
      // ELECTRONICS (6 Products)
      // ----------------------------------------------------
      {
        title: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
        description: 'Industry-leading noise canceling with two processors and 8 microphones. Up to 30-hour battery life with ultra-quick charge (3 mins = 3 hours playback). Crystal clear hands-free calling with Precise Voice Pickup Technology.',
        price: 29990,
        discountPrice: 26990,
        category: 'Electronics',
        stock: 45,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.9,
        numReviews: 128,
        isFeatured: true,
        tags: ['audio', 'headphones', 'sony', 'wireless', 'noise-cancelling'],
        vendor: vendorElectronics._id,
        store: storeElectronics._id,
      },
      {
        title: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum',
        description: 'Powerful S9 SiP chip with revolutionary double-tap gesture, brighter Always-On Retina display, faster on-device Siri, and precision finding for iPhone. Comprehensive health tracking with ECG and blood oxygen metrics.',
        price: 44900,
        discountPrice: 41900,
        category: 'Electronics',
        stock: 28,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.8,
        numReviews: 95,
        isFeatured: true,
        tags: ['smartwatch', 'apple', 'fitness', 'wearables'],
        vendor: vendorElectronics._id,
        store: storeElectronics._id,
      },
      {
        title: 'Samsung 55-inch 4K Ultra HD Smart Neo QLED TV',
        description: 'Quantum Matrix Technology with Quantum Mini LEDs for supreme contrast and vivid color. Neural Quantum Processor 4K with AI upscaling, Dolby Atmos multidirectional 3D audio, and ultra-smooth 120Hz gaming support.',
        price: 74990,
        discountPrice: 64990,
        category: 'Electronics',
        stock: 15,
        images: [
          'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.8,
        numReviews: 142,
        isFeatured: true,
        tags: ['tv', 'samsung', 'smart tv', '4k', 'qled'],
        vendor: vendorElectronics._id,
        store: storeElectronics._id,
      },
      {
        title: 'Mechanical RGB Gaming Keyboard (Tactile Red Linear Switches)',
        description: 'Aircraft-grade anodized aluminum frame with hot-swappable linear mechanical red switches, per-key RGB backlighting, detachable braided Type-C cable, and sound-dampening acoustic silicone pads.',
        price: 4999,
        discountPrice: 3899,
        category: 'Electronics',
        stock: 60,
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.7,
        numReviews: 64,
        isFeatured: false,
        tags: ['keyboard', 'gaming', 'rgb', 'pc', 'mechanical'],
        vendor: vendorElectronics._id,
        store: storeElectronics._id,
      },
      {
        title: 'Apple MacBook Air 13-inch M2 Chip (16GB RAM, 512GB SSD)',
        description: 'Strikingly thin design in Midnight finish. Apple M2 8-core CPU with 10-core GPU, 13.6-inch Liquid Retina display with True Tone, 1080p FaceTime HD camera, MagSafe 3 charging port, and up to 18 hours of battery life.',
        price: 119900,
        discountPrice: 108900,
        category: 'Electronics',
        stock: 20,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.9,
        numReviews: 184,
        isFeatured: true,
        tags: ['laptop', 'apple', 'macbook', 'ultrabook', 'm2'],
        vendor: vendorElectronics._id,
        store: storeElectronics._id,
      },
      {
        title: 'Sony Alpha 7 IV Full-Frame Mirrorless Camera (33MP Body)',
        description: 'New 33MP full-frame Exmor R back-illuminated CMOS sensor with BIONZ XR processing engine. 4K 60p 10-bit 4:2:2 recording, real-time eye autofocus for humans, animals, and birds, and 5-axis optical image stabilization.',
        price: 189990,
        discountPrice: 174990,
        category: 'Electronics',
        stock: 12,
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.9,
        numReviews: 48,
        isFeatured: false,
        tags: ['camera', 'sony', 'photography', '4k', 'mirrorless'],
        vendor: vendorElectronics._id,
        store: storeElectronics._id,
      },

      // ----------------------------------------------------
      // FURNITURE (5 Products)
      // ----------------------------------------------------
      {
        title: 'Scandinavian 3-Seater Fabric Sofa in Midnight Blue',
        description: 'High-density foam cushioning with breathable stain-resistant linen fabric and solid kiln-dried eucalyptus wood frame. Tapered natural oak wood legs with floor protectors. Includes two matching accent bolster cushions.',
        price: 38999,
        discountPrice: 32499,
        category: 'Furniture',
        stock: 18,
        images: [
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.7,
        numReviews: 53,
        isFeatured: true,
        tags: ['sofa', 'living room', 'scandinavian', 'furniture', 'couch'],
        vendor: vendorFurniture._id,
        store: storeFurniture._id,
      },
      {
        title: 'Solid Sheesham Wood King Size Bed with Box Storage',
        description: 'Handcrafted from 100% natural Grade-A Sheesham wood with natural teak grain finish. Integrated hydraulic box storage compartment with termite-resistant treated plywood boards and slatted mattress support.',
        price: 45999,
        discountPrice: 38999,
        category: 'Furniture',
        stock: 10,
        images: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.8,
        numReviews: 76,
        isFeatured: true,
        tags: ['bed', 'bedroom', 'wooden', 'sheesham', 'furniture', 'storage'],
        vendor: vendorFurniture._id,
        store: storeFurniture._id,
      },
      {
        title: 'Ergonomic High-Back Executive Office Chair with Lumbar Support',
        description: 'Heavy-duty breathable Korean mesh backrest with dynamic 3D adjustable lumbar pad. Multi-lock synchronized tilt mechanism, height-adjustable 4D armrests, and Class-4 heavy-duty hydraulic gas lift cylinder.',
        price: 12999,
        discountPrice: 9999,
        category: 'Furniture',
        stock: 40,
        images: [
          'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.6,
        numReviews: 89,
        isFeatured: false,
        tags: ['chair', 'office', 'ergonomic', 'study desk', 'furniture'],
        vendor: vendorFurniture._id,
        store: storeFurniture._id,
      },
      {
        title: 'Modern Minimalist Solid Oak Dining Table (6-Seater)',
        description: 'Constructed from sustainably sourced white oak with a durable matte polyurethane protective coating. Beveled edges with rounded corners for family safety. Sits up to 6 people comfortably.',
        price: 28999,
        discountPrice: 24499,
        category: 'Furniture',
        stock: 14,
        images: [
          'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.8,
        numReviews: 38,
        isFeatured: false,
        tags: ['dining table', 'oak', 'kitchen', 'dining', 'furniture'],
        vendor: vendorFurniture._id,
        store: storeFurniture._id,
      },
      {
        title: 'Engineered Wood Study & Computer Desk with Storage Shelves',
        description: 'Compact space-saving design with durable scratch-resistant melamine finish. Built-in 3-tier side bookshelves, cable management grommets, and reinforced steel frame legs.',
        price: 8499,
        discountPrice: 6999,
        category: 'Furniture',
        stock: 35,
        images: [
          'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.5,
        numReviews: 62,
        isFeatured: false,
        tags: ['desk', 'study', 'workstation', 'home office', 'furniture'],
        vendor: vendorFurniture._id,
        store: storeFurniture._id,
      },

      // ----------------------------------------------------
      // GROCERY (5 Products)
      // ----------------------------------------------------
      {
        title: 'Royal Himalayan Organic Basmati Rice (5kg Pack)',
        description: 'Aged for over two years in Himalayan foothills. Extra-long slender grains that elongate up to twice their size upon cooking. 100% pesticide-free, non-GMO certified with rich natural aroma.',
        price: 999,
        discountPrice: 849,
        category: 'Grocery',
        stock: 120,
        images: [
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.8,
        numReviews: 215,
        isFeatured: true,
        tags: ['rice', 'basmati', 'organic', 'grocery', 'staples'],
        vendor: vendorGrocery._id,
        store: storeGrocery._id,
      },
      {
        title: 'Cold-Pressed Raw Organic Wildflower Honey (1kg Glass Jar)',
        description: 'Unprocessed, unheated, and unfiltered raw multi-floral honey harvested ethically from pristine Nilgiri forest apiaries. Naturally rich in enzymes, pollen, and immune-boosting antioxidants.',
        price: 749,
        discountPrice: 629,
        category: 'Grocery',
        stock: 85,
        images: [
          'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.9,
        numReviews: 124,
        isFeatured: true,
        tags: ['honey', 'organic', 'healthy', 'grocery', 'raw honey'],
        vendor: vendorGrocery._id,
        store: storeGrocery._id,
      },
      {
        title: 'Premium California Whole Almonds (1kg Nitrogen-Sealed Pouch)',
        description: 'Hand-picked supreme-sized California almonds packed in resealable nitrogen-flushed zipper pouch for ultimate crunch and freshness. Loaded with plant protein, dietary fiber, and Vitamin E.',
        price: 1199,
        discountPrice: 999,
        category: 'Grocery',
        stock: 95,
        images: [
          'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.8,
        numReviews: 156,
        isFeatured: false,
        tags: ['dry fruits', 'almonds', 'healthy snacks', 'grocery', 'nuts'],
        vendor: vendorGrocery._id,
        store: storeGrocery._id,
      },
      {
        title: 'Organic Cold-Pressed Wood-Chekku Virgin Coconut Oil (1 Litre)',
        description: 'Extracted traditional wooden cold-press (Mara Chekku) method from sun-dried coconut copras. Zero heat processing, zero preservatives. Ideal for daily cooking, keto diet, and skin conditioning.',
        price: 499,
        discountPrice: 419,
        category: 'Grocery',
        stock: 70,
        images: [
          'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.7,
        numReviews: 87,
        isFeatured: false,
        tags: ['cooking oil', 'coconut oil', 'organic', 'grocery', 'cold pressed'],
        vendor: vendorGrocery._id,
        store: storeGrocery._id,
      },
      {
        title: 'Artisanal South Indian Kumbakonam Filter Coffee Blend (500g)',
        description: 'Authentic 80:20 Arabica and Robusta coffee blend infused with select roasted chicory. Slow-roasted in traditional drum roasters for rich frothy decoction with deep aromatic notes.',
        price: 399,
        discountPrice: 349,
        category: 'Grocery',
        stock: 110,
        images: [
          'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.9,
        numReviews: 182,
        isFeatured: false,
        tags: ['coffee', 'filter coffee', 'beverage', 'grocery', 'kumbakonam'],
        vendor: vendorGrocery._id,
        store: storeGrocery._id,
      },

      // ----------------------------------------------------
      // FASHION / CLOTHING (5 Products)
      // ----------------------------------------------------
      {
        title: 'Men\'s Tailored Slim Fit Linen Casual Shirt (Sky Blue)',
        description: 'Spun from 100% pure European flax linen. Soft bio-washed texture for lightweight cooling in tropical weather. Features semi-spread collar, mother-of-pearl buttons, and curved hemline.',
        price: 2499,
        discountPrice: 1899,
        category: 'Fashion',
        stock: 55,
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.7,
        numReviews: 92,
        isFeatured: true,
        tags: ['shirt', 'men', 'linen', 'casual', 'fashion', 'clothing'],
        vendor: vendorFashion._id,
        store: storeFashion._id,
      },
      {
        title: 'Women\'s Handwoven Pure Chanderi Silk Saree with Zari Pallu',
        description: 'Authentic Chanderi silk handloom saree with delicate gold zari booti motifs and traditional rich border. Includes matching unstitched blouse piece in contrast gold tint.',
        price: 5999,
        discountPrice: 4499,
        category: 'Fashion',
        stock: 30,
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.9,
        numReviews: 78,
        isFeatured: true,
        tags: ['saree', 'ethnic', 'silk', 'women', 'fashion', 'clothing'],
        vendor: vendorFashion._id,
        store: storeFashion._id,
      },
      {
        title: 'Unisex Vintage Washed Rugged Denim Biker Jacket',
        description: 'Heavyweight 14oz indigo cotton denim treated with stone washing and enzyme distress detailing. Dual flap chest pockets, brass shank buttons, and adjustable waist cinches.',
        price: 4299,
        discountPrice: 3299,
        category: 'Fashion',
        stock: 40,
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.6,
        numReviews: 64,
        isFeatured: false,
        tags: ['jacket', 'denim', 'outerwear', 'streetwear', 'fashion', 'clothing'],
        vendor: vendorFashion._id,
        store: storeFashion._id,
      },
      {
        title: '100% Organic Heavyweight Cotton Oversized T-Shirt (Oatmeal)',
        description: '240 GSM combed ring-spun organic cotton with dropped shoulders, reinforced ribbed crew collar, and pre-shrunk fabric to prevent post-wash deformation.',
        price: 1499,
        discountPrice: 999,
        category: 'Fashion',
        stock: 80,
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.8,
        numReviews: 122,
        isFeatured: false,
        tags: ['t-shirt', 'cotton', 'oversized', 'casual', 'clothing', 'fashion'],
        vendor: vendorFashion._id,
        store: storeFashion._id,
      },
      {
        title: 'Women\'s Floral Print A-Line Maxi Dress with Belt',
        description: 'Airy georgette fabric with subtle lining. Sweetheart neckline, tiered flutter skirt, and detachable fabric tie belt for an elegant silhouette.',
        price: 2899,
        discountPrice: 2199,
        category: 'Fashion',
        stock: 45,
        images: [
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.7,
        numReviews: 45,
        isFeatured: false,
        tags: ['dress', 'women', 'maxi dress', 'floral', 'fashion', 'clothing'],
        vendor: vendorFashion._id,
        store: storeFashion._id,
      },

      // ----------------------------------------------------
      // FOOTWEAR (3 Products)
      // ----------------------------------------------------
      {
        title: 'Men\'s Classic Handcrafted Leather Chelsea Boots (Tan Brown)',
        description: 'Genuine full-grain crust leather upper with elasticated side gussets and pull-on tabs. Breathable sheepskin leather insole and anti-skid rubber studded sole.',
        price: 5499,
        discountPrice: 4299,
        category: 'Footwear',
        stock: 32,
        images: [
          'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.8,
        numReviews: 68,
        isFeatured: true,
        tags: ['boots', 'leather', 'footwear', 'chelsea', 'shoes'],
        vendor: vendorFashion._id,
        store: storeFashion._id,
      },
      {
        title: 'Ultra-Lightweight Carbon Foam Performance Running Sneakers',
        description: 'Engineered mesh upper with adaptive foot lockdown. Carbon-infused EVA bounce foam midsole that returns 85% energy on every stride. High-abrasion carbon rubber outsole.',
        price: 3999,
        discountPrice: 2999,
        category: 'Footwear',
        stock: 65,
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.7,
        numReviews: 118,
        isFeatured: false,
        tags: ['sneakers', 'running', 'sports', 'footwear', 'shoes'],
        vendor: vendorFashion._id,
        store: storeFashion._id,
      },
      {
        title: 'Women\'s Pointed Toe Formal Block Heel Pumps (Nude Beige)',
        description: 'Soft faux-leather upper with dual-layer memory foam cushioning footbed. 2.5-inch sturdy architectural block heel designed for all-day workwear comfort.',
        price: 2999,
        discountPrice: 2299,
        category: 'Footwear',
        stock: 25,
        images: [
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.6,
        numReviews: 44,
        isFeatured: false,
        tags: ['heels', 'formal', 'women', 'footwear', 'pumps', 'shoes'],
        vendor: vendorFashion._id,
        store: storeFashion._id,
      },

      // ----------------------------------------------------
      // ACCESSORIES (3 Products)
      // ----------------------------------------------------
      {
        title: 'Top-Grain Vintage Hunter Leather Bifold Wallet with RFID Shield',
        description: 'Hand-stitched oil-pulled buffalo leather that develops a rich natural patina with use. 8 card slots, 2 currency compartments, and military-grade RFID blocking liner.',
        price: 1999,
        discountPrice: 1499,
        category: 'Accessories',
        stock: 75,
        images: [
          'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.8,
        numReviews: 135,
        isFeatured: true,
        tags: ['wallet', 'leather', 'accessories', 'rfid', 'men'],
        vendor: vendorFashion._id,
        store: storeFashion._id,
      },
      {
        title: 'Polarized Aviator Sunglasses with UV400 Protection (Gold Frame)',
        description: 'Ultralight stainless steel wire frame with corrosion-resistant gold plating. HD polarized green-tinted lenses blocking 100% of harmful UVA and UVB radiation.',
        price: 2799,
        discountPrice: 1999,
        category: 'Accessories',
        stock: 50,
        images: [
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.7,
        numReviews: 76,
        isFeatured: false,
        tags: ['sunglasses', 'eyewear', 'accessories', 'aviator', 'polarized'],
        vendor: vendorFashion._id,
        store: storeFashion._id,
      },
      {
        title: 'Minimalist Weatherproof Commuter Laptop Backpack (25L Capacity)',
        description: 'Water-repellent 900D ballistic nylon fabric with padded shockproof compartment fitting up to 16-inch laptops. External USB fast charging port and concealed anti-theft back pocket.',
        price: 3499,
        discountPrice: 2699,
        category: 'Accessories',
        stock: 45,
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
        ],
        rating: 4.8,
        numReviews: 104,
        isFeatured: true,
        tags: ['backpack', 'travel', 'laptop bag', 'accessories', 'waterproof'],
        vendor: vendorFashion._id,
        store: storeFashion._id,
      },
    ];

    // If user's store exists, assign a few featured items to it as well!
    if (userStore) {
      productsData[0].store = userStore._id;
      productsData[0].vendor = userStore.vendor;
      productsData[6].store = userStore._id;
      productsData[6].vendor = userStore.vendor;
      productsData[11].store = userStore._id;
      productsData[11].vendor = userStore.vendor;
    }

    const created = await Product.insertMany(productsData);
    console.log(`[Product Seeder] Successfully seeded ${created.length} products into MongoDB!`);

    const summary = {};
    created.forEach((p) => {
      summary[p.category] = (summary[p.category] || 0) + 1;
    });

    console.log('\n==================================================');
    console.log('Seeded Products Summary by Category:');
    Object.entries(summary).forEach(([cat, count]) => {
      console.log(` - ${cat}: ${count} products`);
    });
    console.log(`Total Products in Database: ${created.length}`);
    console.log('==================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Product Seeder Error]:', err);
    process.exit(1);
  }
};

seedProducts();
