const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const Store = require('../models/Store');
const PlatformSetting = require('../models/PlatformSetting');
const { mockProducts } = require('../config/mockStore');

const DEODAP_BASE_URL = process.env.DEODAP_API_URL || 'https://deodap.in';

// Curated Category Collections across DeoDap
const DEODAP_CATEGORIES = [
  {
    category: 'Electronics',
    handles: ['electronics', 'electronic-gadgets', 'computers-electronics', 'accessories-peripherals'],
    label: 'Electronics & Gadgets',
  },
  {
    category: 'Home & Kitchen',
    handles: ['daily-cooking-tools', 'kitchen-dining', 'decor-ambience', 'daily-cleaning-tools', 'bakeware'],
    label: 'Kitchen & Home Living',
  },
  {
    category: 'Toys',
    handles: ['toys-games', 'baby-toddler-toys', 'educational-toys', 'baby-toys'],
    label: 'Toys & Kids Games',
  },
  {
    category: 'Beauty',
    handles: ['beauty', 'beautyhair-care', 'health-personal-care', 'beautyskin-careface'],
    label: 'Beauty & Personal Care',
  },
  {
    category: 'Fitness',
    handles: ['fitness-sports', 'exercise-fitness', 'fitness-gym-training'],
    label: 'Fitness & Sports Gear',
  },
  {
    category: 'Fashion',
    handles: ['fashion-jewellery', 'bags-wallets-and-luggage', 'bags-backpacks', 'apparel-general'],
    label: 'Fashion, Bags & Jewellery',
  },
  {
    category: 'Automotive',
    handles: ['automotive', 'automotive-parts-tools'],
    label: 'Automotive & Hardware Tools',
  },
];

/**
 * Clean and strip HTML tags from Shopify product body
 */
const cleanHtmlDescription = (html) => {
  if (!html) return 'Premium quality product sourced directly from DeoDap wholesale dropshipping network.';
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);
};

/**
 * Intelligent category mapper
 */
const mapCategory = (assignedCategory, productType = '', tags = [], title = '') => {
  if (assignedCategory && assignedCategory !== 'all') {
    return assignedCategory;
  }

  const combined = `${productType} ${(tags || []).join(' ')} ${title}`.toLowerCase();

  if (combined.includes('toy') || combined.includes('kid') || combined.includes('baby') || combined.includes('game') || combined.includes('doll') || combined.includes('puzzle')) {
    return 'Toys';
  }
  if (combined.includes('electronic') || combined.includes('usb') || combined.includes('cable') || combined.includes('earbud') || combined.includes('watch') || combined.includes('speaker') || combined.includes('lamp') || combined.includes('torch') || combined.includes('led') || combined.includes('headphone') || combined.includes('pc') || combined.includes('mouse')) {
    return 'Electronics';
  }
  if (combined.includes('beauty') || combined.includes('skin') || combined.includes('hair') || combined.includes('nail') || combined.includes('face') || combined.includes('massager') || combined.includes('care') || combined.includes('pimple') || combined.includes('cosmetic')) {
    return 'Beauty';
  }
  if (combined.includes('fitness') || combined.includes('gym') || combined.includes('yoga') || combined.includes('workout') || combined.includes('exercise') || combined.includes('sport')) {
    return 'Fitness';
  }
  if (combined.includes('jewel') || combined.includes('cuff') || combined.includes('bracelet') || combined.includes('bag') || combined.includes('wallet') || combined.includes('luggage') || combined.includes('fashion') || combined.includes('cloth') || combined.includes('wear') || combined.includes('apparel')) {
    return 'Fashion';
  }
  if (combined.includes('auto') || combined.includes('car') || combined.includes('bike') || combined.includes('cycle') || combined.includes('repair') || combined.includes('tire') || combined.includes('tool') || combined.includes('hardware')) {
    return 'Automotive';
  }
  return 'Home & Kitchen';
};

/**
 * Fetch raw catalog from a specific DeoDap collection endpoint
 */
const fetchFromCollection = async (handle, limit = 10, page = 1) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const url = `${DEODAP_BASE_URL}/collections/${handle}/products.json?limit=${limit}&page=${page}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.products) ? data.products : [];
  } catch (err) {
    console.warn(`[DeoDap Collection Fetch Note] ${handle}:`, err.message);
    return [];
  }
};

/**
 * Fetch raw catalog from DeoDap public Shopify JSON endpoint
 */
const fetchDeoDapProducts = async ({ limit = 50, page = 1 } = {}) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const url = `${DEODAP_BASE_URL}/products.json?limit=${limit}&page=${page}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`DeoDap HTTP error: status ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data.products) ? data.products : [];
  } catch (err) {
    console.error('[DeoDap Service Error] fetchDeoDapProducts:', err.message);
    return [];
  }
};

/**
 * Multi-Category Diversified DeoDap Fetcher
 * Pulls products across all major categories (Electronics, Kitchen, Toys, Beauty, Fitness, Fashion, Auto)
 */
const fetchDiverseDeoDapProducts = async ({ totalLimit = 60, selectedCategory = 'all' } = {}) => {
  let targetCategories = DEODAP_CATEGORIES;

  if (selectedCategory && selectedCategory !== 'all') {
    const matched = DEODAP_CATEGORIES.filter(
      (c) => c.category.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (matched.length > 0) {
      targetCategories = matched;
    }
  }

  const perCategoryLimit = Math.max(5, Math.ceil(totalLimit / targetCategories.length));
  console.log(`[DeoDap Diverse Fetch] Pulling ~${perCategoryLimit} products each across ${targetCategories.length} categories...`);

  const categoryPromises = targetCategories.map(async (catInfo) => {
    let items = [];
    for (const handle of catInfo.handles) {
      if (items.length >= perCategoryLimit) break;
      const fetched = await fetchFromCollection(handle, perCategoryLimit - items.length, 1);
      if (fetched.length > 0) {
        // Tag products with their verified category
        const tagged = fetched.map((p) => ({ ...p, _assignedCategory: catInfo.category }));
        items.push(...tagged);
      }
    }
    return items;
  });

  const categoryResults = await Promise.all(categoryPromises);
  const flattened = categoryResults.flat();

  // If collection fetch returned too few items, supplement with general products.json
  if (flattened.length < 15) {
    try {
      const general = await fetchDeoDapProducts({ limit: 30, page: 1 });
      flattened.push(...general);
    } catch {
      // Quiet fallback
    }
  }

  // Deduplicate products by id
  const seenIds = new Set();
  const uniqueProducts = [];
  for (const prod of flattened) {
    if (!seenIds.has(prod.id)) {
      seenIds.add(prod.id);
      uniqueProducts.push(prod);
    }
  }

  console.log(`[DeoDap Diverse Fetch] Fetched ${uniqueProducts.length} diverse products across all categories.`);
  return uniqueProducts.slice(0, Math.max(totalLimit, uniqueProducts.length));
};

/**
 * Synchronize DeoDap catalog with automatic profit margin calculation
 * across all product types and categories
 */
const syncDeoDapCatalog = async ({ limit = 60, profitMarginPercent = 30, category = 'all' } = {}) => {
  const marginPct = Number(profitMarginPercent) || 30;

  // 1. Fetch diverse products across all categories from DeoDap
  const deodapProducts = await fetchDiverseDeoDapProducts({
    totalLimit: Math.max(Number(limit) || 60, 40),
    selectedCategory: category,
  });

  if (deodapProducts.length === 0) {
    throw new Error('No products received from DeoDap catalog feed.');
  }

  // 2. Fallback to mock store if DB is offline
  if (mongoose.connection.readyState !== 1) {
    let created = 0;
    for (const raw of deodapProducts) {
      const variant = raw.variants?.[0] || {};
      const sourcePrice = Math.max(20, Math.round(parseFloat(variant.price) || 199));
      const profitMargin = Math.max(50, Math.round(sourcePrice * (marginPct / 100)));
      const sellingPrice = sourcePrice + profitMargin;
      const discountPrice = variant.compare_at_price && parseFloat(variant.compare_at_price) > sellingPrice
        ? Math.round(parseFloat(variant.compare_at_price))
        : Math.round(sellingPrice * 1.35);

      const assignedCategory = mapCategory(raw._assignedCategory, raw.product_type, raw.tags, raw.title);
      const existingIndex = mockProducts.findIndex((p) => p.sku === variant.sku || p.title === raw.title);
      const productObj = {
        _id: existingIndex >= 0 ? mockProducts[existingIndex]._id : `mock_deo_${raw.id}`,
        title: raw.title,
        description: cleanHtmlDescription(raw.body_html),
        category: assignedCategory,
        price: sellingPrice,
        discountPrice,
        stock: variant.available !== false ? 50 : 0,
        images: (raw.images || []).map((img) => img.src).filter(Boolean),
        sourcePlatform: 'deodap',
        sourceUrl: `${DEODAP_BASE_URL}/products/${raw.handle}`,
        sourcePrice,
        profitMargin,
        isDropshipped: true,
        sku: variant.sku || `DEO-${raw.id}`,
        deodapProductId: String(raw.id),
        deodapHandle: raw.handle,
        lastSyncedAt: new Date(),
        rating: 4.8,
        numReviews: 24,
      };

      if (existingIndex >= 0) {
        mockProducts[existingIndex] = { ...mockProducts[existingIndex], ...productObj };
      } else {
        mockProducts.unshift(productObj);
        created++;
      }
    }

    return {
      success: true,
      mode: 'mock',
      totalFetched: deodapProducts.length,
      createdCount: created,
      updatedCount: deodapProducts.length - created,
      totalSynced: mockProducts.filter((p) => p.sourcePlatform === 'deodap').length,
      profitMarginPercent: marginPct,
      message: `Successfully synchronized ${deodapProducts.length} diverse products across all categories with +${marginPct}% profit margin!`,
    };
  }

  // 3. Ensure Admin User & Flagship Store in MongoDB
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

  let store = await Store.findOne({ slug: 'official-flagship-store' }) || await Store.findOne({ status: 'active' });
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

  let createdCount = 0;
  let updatedCount = 0;

  for (const raw of deodapProducts) {
    const variant = raw.variants?.[0] || {};
    const sourcePrice = Math.max(20, Math.round(parseFloat(variant.price) || 199));
    const profitMargin = Math.max(50, Math.round(sourcePrice * (marginPct / 100)));
    const sellingPrice = sourcePrice + profitMargin;
    const discountPrice =
      variant.compare_at_price && parseFloat(variant.compare_at_price) > sellingPrice
        ? Math.round(parseFloat(variant.compare_at_price))
        : Math.round(sellingPrice * 1.35);

    const images = (raw.images || []).map((img) => img.src).filter(Boolean);
    const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
    const finalImages = images.length > 0 ? images : [fallbackImage];

    const sku = variant.sku || `DEO-${raw.id}`;
    const sourceUrl = `${DEODAP_BASE_URL}/products/${raw.handle}`;
    const categoryName = mapCategory(raw._assignedCategory, raw.product_type, raw.tags, raw.title);
    const cleanDesc = cleanHtmlDescription(raw.body_html);

    // Look for existing product
    const existing = await Product.findOne({
      $or: [
        { deodapProductId: String(raw.id) },
        { sku },
        { sourceUrl },
        { title: raw.title },
      ],
    });

    if (existing) {
      existing.title = raw.title;
      existing.description = cleanDesc || existing.description;
      existing.category = categoryName;
      existing.sourcePrice = sourcePrice;
      existing.profitMargin = profitMargin;
      existing.price = sellingPrice;
      existing.discountPrice = discountPrice;
      existing.stock = variant.available !== false ? 50 : 0;
      existing.images = finalImages;
      existing.sourcePlatform = 'deodap';
      existing.sourceUrl = sourceUrl;
      existing.isDropshipped = true;
      existing.sku = sku;
      existing.deodapProductId = String(raw.id);
      existing.deodapHandle = raw.handle;
      existing.lastSyncedAt = new Date();
      await existing.save();
      updatedCount++;
    } else {
      await Product.create({
        title: raw.title,
        description: cleanDesc,
        category: categoryName,
        price: sellingPrice,
        discountPrice,
        stock: variant.available !== false ? 50 : 0,
        images: finalImages,
        vendor: admin._id,
        store: store._id,
        rating: +(4.6 + Math.random() * 0.3).toFixed(1),
        numReviews: Math.floor(15 + Math.random() * 45),
        sourcePlatform: 'deodap',
        sourceUrl,
        sourcePrice,
        profitMargin,
        isDropshipped: true,
        sku,
        deodapProductId: String(raw.id),
        deodapHandle: raw.handle,
        lastSyncedAt: new Date(),
        tags: Array.isArray(raw.tags) ? raw.tags : [],
      });
      createdCount++;
    }
  }

  // Update Platform Settings with sync timestamp and total count
  const totalDeoCount = await Product.countDocuments({ sourcePlatform: 'deodap' });
  await PlatformSetting.findOneAndUpdate(
    {},
    {
      deodapProfitMarginPercent: marginPct,
      deodapLastSyncAt: new Date(),
      deodapTotalSynced: totalDeoCount,
      deodapAutoSync: true,
    },
    { upsert: true }
  );

  return {
    success: true,
    totalFetched: deodapProducts.length,
    createdCount,
    updatedCount,
    totalSynced: totalDeoCount,
    profitMarginPercent: marginPct,
    message: `Successfully synchronized ${deodapProducts.length} diverse products across all categories (Electronics, Kitchen, Toys, Beauty, Fitness, Fashion, Automotive) with +${marginPct}% profit margin!`,
  };
};

/**
 * Batch update profit margins for all DeoDap products in catalog
 */
const updateProfitMarginAll = async (profitMarginPercent) => {
  const marginPct = Number(profitMarginPercent);
  if (isNaN(marginPct) || marginPct < 0) {
    throw new Error('Invalid profit margin percentage');
  }

  if (mongoose.connection.readyState !== 1) {
    mockProducts.forEach((p) => {
      if (p.sourcePlatform === 'deodap' && p.sourcePrice > 0) {
        p.profitMargin = Math.max(50, Math.round(p.sourcePrice * (marginPct / 100)));
        p.price = p.sourcePrice + p.profitMargin;
        p.discountPrice = Math.round(p.price * 1.35);
      }
    });
    return { success: true, updatedCount: mockProducts.filter((p) => p.sourcePlatform === 'deodap').length };
  }

  const deodapProducts = await Product.find({ sourcePlatform: 'deodap' });
  let count = 0;
  for (const prod of deodapProducts) {
    const cost = prod.sourcePrice || 199;
    prod.profitMargin = Math.max(50, Math.round(cost * (marginPct / 100)));
    prod.price = cost + prod.profitMargin;
    prod.discountPrice = Math.max(prod.discountPrice || 0, Math.round(prod.price * 1.35));
    await prod.save();
    count++;
  }

  await PlatformSetting.findOneAndUpdate(
    {},
    { deodapProfitMarginPercent: marginPct },
    { upsert: true }
  );

  return { success: true, updatedCount: count, profitMarginPercent: marginPct };
};

/**
 * Get DeoDap statistics & catalog metrics
 */
const getDeoDapStats = async () => {
  let settings = null;
  let totalDeoProducts = 0;
  let inStockCount = 0;
  let totalWholesaleCost = 0;
  let totalRetailSelling = 0;
  let totalProfitMargin = 0;
  let categoryBreakdown = {};

  if (mongoose.connection.readyState === 1) {
    settings = await PlatformSetting.findOne();
    const prods = await Product.find({ sourcePlatform: 'deodap' });
    totalDeoProducts = prods.length;
    inStockCount = prods.filter((p) => p.stock > 0).length;
    totalWholesaleCost = prods.reduce((sum, p) => sum + (p.sourcePrice || 0), 0);
    totalRetailSelling = prods.reduce((sum, p) => sum + (p.price || 0), 0);
    totalProfitMargin = prods.reduce((sum, p) => sum + (p.profitMargin || 0), 0);

    prods.forEach((p) => {
      const cat = p.category || 'General';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });
  } else {
    const prods = mockProducts.filter((p) => p.sourcePlatform === 'deodap');
    totalDeoProducts = prods.length;
    inStockCount = prods.filter((p) => p.stock > 0).length;
    totalWholesaleCost = prods.reduce((sum, p) => sum + (p.sourcePrice || 0), 0);
    totalRetailSelling = prods.reduce((sum, p) => sum + (p.price || 0), 0);
    totalProfitMargin = prods.reduce((sum, p) => sum + (p.profitMargin || 0), 0);

    prods.forEach((p) => {
      const cat = p.category || 'General';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });
  }

  const marginPct = settings?.deodapProfitMarginPercent ?? 30;

  return {
    source: 'deodap.in',
    status: 'connected',
    profitMarginPercent: marginPct,
    autoSyncEnabled: settings?.deodapAutoSync ?? true,
    lastSyncAt: settings?.deodapLastSyncAt || new Date(),
    totalProducts: totalDeoProducts,
    inStockCount,
    totalWholesaleCost,
    totalRetailSelling,
    totalProfitMargin,
    averageMarginPerItem: totalDeoProducts > 0 ? Math.round(totalProfitMargin / totalDeoProducts) : 0,
    categoryBreakdown,
    availableCategories: DEODAP_CATEGORIES.map((c) => ({ category: c.category, label: c.label })),
  };
};

module.exports = {
  fetchDeoDapProducts,
  fetchDiverseDeoDapProducts,
  syncDeoDapCatalog,
  updateProfitMarginAll,
  getDeoDapStats,
  DEODAP_CATEGORIES,
};
