const mongoose = require('mongoose');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { uploadToCloudinary } = require('../config/cloudinary');
const { mockProducts, mockStores } = require('../config/mockStore');
const { scrapeProductUrl, getSourcingTemplates } = require('../utils/urlScraper');

// @desc    Extract product details from external link (Amazon, Flipkart, Meesho, DeoDap)
// @route   POST /api/products/scrape-preview
// @access  Private (Admin / Vendor)
exports.scrapeProductPreview = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const scraped = await scrapeProductUrl(url);
    res.status(200).json({
      success: true,
      data: scraped,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get curated sourcing templates for 1-click test listing
// @route   GET /api/products/sourcing-templates
// @access  Private (Admin / Vendor)
exports.getSourcingTemplatesController = (req, res) => {
  res.status(200).json({
    success: true,
    templates: getSourcingTemplates(),
  });
};

// @desc    Get all products with filtering, search, and sorting
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { keyword, category, minPrice, maxPrice, sort, page = 1, limit = 20, featured } = req.query;

    // Use MockStore if MongoDB is offline
    if (mongoose.connection.readyState !== 1) {
      let filtered = [...mockProducts];

      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(kw) ||
            p.description.toLowerCase().includes(kw) ||
            p.category.toLowerCase().includes(kw)
        );
      }

      if (category && category !== 'All') {
        filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
      }

      if (minPrice) {
        filtered = filtered.filter((p) => (p.discountPrice || p.price) >= Number(minPrice));
      }
      if (maxPrice) {
        filtered = filtered.filter((p) => (p.discountPrice || p.price) <= Number(maxPrice));
      }

      if (sort === 'price-asc') filtered.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
      else if (sort === 'price-desc') filtered.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
      else if (sort === 'rating') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      const total = filtered.length;
      const skip = (Number(page) - 1) * Number(limit);
      const paginated = filtered.slice(skip, skip + Number(limit));

      return res.status(200).json({
        success: true,
        count: paginated.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        products: paginated,
      });
    }

    const query = {};

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } },
      ];
    }

    if (category && category !== 'All') {
      if (['fashion', 'clothing'].includes(category.toLowerCase())) {
        query.category = { $in: ['Fashion', 'Clothing'] };
      } else {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    else if (sort === 'price-desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };

    // Active, non-expired stores query
    const activeStores = await Store.find({
      status: 'active',
      $or: [
        { planExpiresAt: { $exists: false } },
        { planExpiresAt: null },
        { planExpiresAt: { $gt: new Date() } },
      ],
    }).select('_id');

    const activeStoreIds = activeStores.map((s) => s._id);
    query.store = { $in: activeStoreIds };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('store', 'storeName logo rating numReviews')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const product = mockProducts.find((p) => p._id === req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.status(200).json({ success: true, product });
    }

    const product = await Product.findById(req.params.id)
      .populate('store', 'storeName logo banner description phone email rating numReviews')
      .populate('vendor', 'name email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get vendor's own products
// @route   GET /api/products/vendor/mine
// @access  Private (Vendor)
exports.getVendorProducts = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: mockProducts.length,
        products: mockProducts,
      });
    }

    const products = await Product.find({ vendor: req.user._id })
      .populate('store', 'storeName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Vendor only - Admin manual product creation is disabled in favor of automated DeoDap sync)
exports.createProduct = async (req, res, next) => {
  try {
    // If admin attempts manual creation, prevent it as requested by marketplace dropship automation policy
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin manual product creation is disabled. Products are automatically synchronized from DeoDap with your configured profit margin. Use the Auto-Fetch DeoDap Products feature.',
      });
    }

    const {
      title,
      description,
      price,
      discountPrice,
      category,
      stock,
      images,
      tags,
      isFeatured,
      sourcePlatform,
      sourceUrl,
      sourcePrice,
    } = req.body;

    const sellingPrice = Number(price);
    const costPrice = Number(sourcePrice) || 0;
    const computedProfitMargin = costPrice > 0 ? Math.max(0, sellingPrice - costPrice) : 0;
    const isDropship = ['amazon', 'flipkart', 'meesho', 'deodap', 'other'].includes(sourcePlatform);

    if (mongoose.connection.readyState !== 1) {
      const newProduct = {
        _id: `prod_${Date.now()}`,
        title,
        description,
        price: sellingPrice,
        discountPrice: discountPrice ? Number(discountPrice) : 0,
        category,
        stock: Number(stock) || 10,
        images: Array.isArray(images) && images.length > 0 ? images : [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
        ],
        tags: Array.isArray(tags) ? tags : [],
        isFeatured: !!isFeatured,
        rating: 5.0,
        numReviews: 1,
        sourcePlatform: sourcePlatform || 'in_house',
        sourceUrl: sourceUrl || '',
        sourcePrice: costPrice,
        profitMargin: computedProfitMargin,
        isDropshipped: isDropship,
        store: mockStores[0],
      };
      mockProducts.unshift(newProduct);
      return res.status(201).json({ success: true, product: newProduct });
    }

    let store = await Store.findOne({ vendor: req.user._id }).populate('activePlan');
    
    // If admin is creating the product and has no vendor store, assign to the flagship store
    if (!store && req.user.role === 'admin') {
      store = await Store.findOne({ status: 'active' });
      if (!store) {
        store = await Store.create({
          vendor: req.user._id,
          storeName: 'Official Flagship Store',
          slug: 'official-flagship-store',
          category: 'Retail',
          status: 'active',
          enrollmentFeePaid: 999,
          planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      }
    }

    if (!store) {
      return res.status(400).json({ success: false, message: 'You must have an active store to add products' });
    }

    // Only enforce plan expiry on non-admins
    if (req.user.role !== 'admin' && (!store.planExpiresAt || new Date(store.planExpiresAt) < new Date())) {
      return res.status(403).json({
        success: false,
        message: 'Your store subscription plan has expired. Please renew your plan to publish products.',
      });
    }

    const product = await Product.create({
      title,
      description,
      price: sellingPrice,
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      category,
      stock: Number(stock) || 10,
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
      ],
      tags: Array.isArray(tags) ? tags : tags ? tags.split(',').map((t) => t.trim()) : [],
      isFeatured: !!isFeatured,
      sourcePlatform: sourcePlatform || 'in_house',
      sourceUrl: sourceUrl || '',
      sourcePrice: costPrice,
      profitMargin: computedProfitMargin,
      isDropshipped: isDropship,
      vendor: req.user._id,
      store: store._id,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Vendor / Admin)
exports.updateProduct = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const idx = mockProducts.findIndex((p) => p._id === req.params.id);
      if (idx !== -1) {
        mockProducts[idx] = { ...mockProducts[idx], ...req.body };
        return res.status(200).json({ success: true, product: mockProducts[idx] });
      }
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Vendor / Admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const idx = mockProducts.findIndex((p) => p._id === req.params.id);
      if (idx !== -1) {
        mockProducts.splice(idx, 1);
        return res.status(200).json({ success: true, message: 'Product deleted' });
      }
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all distinct categories
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const cats = Array.from(new Set(mockProducts.map((p) => p.category)));
      return res.status(200).json({ success: true, categories: cats });
    }

    const categories = await Product.distinct('category');
    res.status(200).json({
      success: true,
      categories: categories.filter(Boolean),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload single product image to Cloudinary
// @route   POST /api/products/upload-image
// @access  Private (Vendor / Admin)
exports.uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please provide an image file' });
    }

    try {
      const result = await uploadToCloudinary(req.file.buffer, 'multivendor_products', req.file.originalname);
      return res.status(200).json({
        success: true,
        url: result.secure_url,
      });
    } catch (err) {
      console.warn('[Cloudinary product upload fallback]', err.message);
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      return res.status(200).json({
        success: true,
        url: dataUri,
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Upload multiple product images to Cloudinary
// @route   POST /api/products/upload-images
// @access  Private (Vendor / Admin)
exports.uploadProductImages = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide one or more product images' });
    }

    const uploadPromises = files.map(async (file) => {
      try {
        const result = await uploadToCloudinary(file.buffer, 'multivendor_products', file.originalname);
        return result.secure_url;
      } catch (err) {
        console.warn(`[Cloudinary fallback for ${file.originalname}]`, err.message);
        return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
    });

    const urls = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      urls,
    });
  } catch (err) {
    next(err);
  }
};
