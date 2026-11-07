const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const Store = require('../models/Store');
const PlatformSetting = require('../models/PlatformSetting');

/**
 * Robust CSV Line Parser that handles commas inside quotes, multi-line values, escaped quotes ("")
 */
const parseCSV = (csvText) => {
  if (!csvText || typeof csvText !== 'string') return [];

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;

  // Normalize Windows / Mac carriage returns
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      }
      insideQuotes = !insideQuotes;
      i++;
      continue;
    }

    if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
      i++;
      continue;
    }

    if (char === '\n' && !insideQuotes) {
      currentRow.push(currentField);
      if (currentRow.some((f) => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
      i++;
      continue;
    }

    currentField += char;
    i++;
  }

  // Push last field & row if anything remaining
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  // First row is headers
  const rawHeaders = rows[0].map((h) => h.trim());
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const parsedObjects = [];
  for (let r = 1; r < rows.length; r++) {
    const rowValues = rows[r];
    const obj = {};
    for (let c = 0; c < rawHeaders.length; c++) {
      const headerOriginal = rawHeaders[c];
      const headerClean = headers[c];
      const val = rowValues[c] !== undefined ? rowValues[c].trim() : '';
      obj[headerOriginal] = val;
      if (headerClean) obj[headerClean] = val;
    }
    parsedObjects.push(obj);
  }

  return parsedObjects;
};

/**
 * Clean HTML descriptions from CSV
 */
const cleanHtml = (html) => {
  if (!html) return 'Quality product sourced directly from DeoDap wholesale catalog.';
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);
};

/**
 * Intelligent category mapper based on Product Category, Type, Tags, Title
 */
const detectCategory = (categoryRaw = '', typeRaw = '', tagsRaw = '', title = '') => {
  const combined = `${categoryRaw} ${typeRaw} ${tagsRaw} ${title}`.toLowerCase();

  if (
    combined.includes('toy') ||
    combined.includes('kid') ||
    combined.includes('baby') ||
    combined.includes('puzzle') ||
    combined.includes('doll') ||
    combined.includes('game')
  ) {
    return 'Toys';
  }
  if (
    combined.includes('electronic') ||
    combined.includes('usb') ||
    combined.includes('cable') ||
    combined.includes('earbud') ||
    combined.includes('bluetooth') ||
    combined.includes('phone') ||
    combined.includes('watch') ||
    combined.includes('speaker') ||
    combined.includes('lamp') ||
    combined.includes('torch') ||
    combined.includes('led') ||
    combined.includes('gadget')
  ) {
    return 'Electronics';
  }
  if (
    combined.includes('beauty') ||
    combined.includes('skin') ||
    combined.includes('hair') ||
    combined.includes('care') ||
    combined.includes('cosmetic') ||
    combined.includes('facial') ||
    combined.includes('massage') ||
    combined.includes('trimmer') ||
    combined.includes('shaver') ||
    combined.includes('roller')
  ) {
    return 'Beauty';
  }
  if (
    combined.includes('kitchen') ||
    combined.includes('cook') ||
    combined.includes('knife') ||
    combined.includes('chopper') ||
    combined.includes('clean') ||
    combined.includes('home') ||
    combined.includes('bottle') ||
    combined.includes('decor') ||
    combined.includes('storage') ||
    combined.includes('mop') ||
    combined.includes('bathroom') ||
    combined.includes('shower') ||
    combined.includes('rack') ||
    combined.includes('basin')
  ) {
    return 'Home & Kitchen';
  }
  if (
    combined.includes('fitness') ||
    combined.includes('sport') ||
    combined.includes('gym') ||
    combined.includes('yoga') ||
    combined.includes('workout') ||
    combined.includes('exercise') ||
    combined.includes('swim') ||
    combined.includes('goggle')
  ) {
    return 'Fitness';
  }
  if (
    combined.includes('fashion') ||
    combined.includes('cloth') ||
    combined.includes('shirt') ||
    combined.includes('saree') ||
    combined.includes('wallet') ||
    combined.includes('bag') ||
    combined.includes('jewel') ||
    combined.includes('wear')
  ) {
    return 'Fashion';
  }
  if (
    combined.includes('car') ||
    combined.includes('bike') ||
    combined.includes('auto') ||
    combined.includes('hardware') ||
    combined.includes('tool') ||
    combined.includes('repair')
  ) {
    return 'Automotive';
  }

  return 'General';
};

/**
 * Process DeoDap CSV file content and save/update products into MongoDB
 * Pricing formula:
 *   - costPrice (sourcePrice) = As stated in CSV ("Variant Price" / "Cost per item")
 *   - mrpPrice (discountPrice) = As stated in CSV ("Variant Compare At Price" / "Compare At Price / India")
 *   - sellingPrice (price) = Math.round(costPrice * 1.30) + 30
 *   - deliveryChargeIncluded = 30
 *   - isFreeDelivery = true
 *   - All raw CSV columns saved into csvData
 *
 * @param {string} csvContent - Raw CSV text
 * @param {object} options - Options: { profitMarginPercent, deliveryCharge, defaultStock, adminUser, storeId, updateExisting }
 */
const importDeoDapCSV = async (csvContent, options = {}) => {
  const {
    profitMarginPercent = 30,
    deliveryCharge = 30,
    defaultStock = 25,
    adminUser = null,
    storeId = null,
    updateExisting = true,
  } = options;

  const rows = parseCSV(csvContent);
  if (!rows || rows.length === 0) {
    throw new Error('CSV file appears empty or could not be parsed.');
  }

  // Group by Handle (or SKU / Title if handle is missing) to merge multi-row variants and images
  const productMap = new Map();

  for (const row of rows) {
    // 1. Identify Handle or unique key
    const handle =
      row.handle ||
      row.Handle ||
      row['Product Handle'] ||
      row.sku ||
      row.variantsku ||
      row['Variant SKU'] ||
      (row.title ? row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null);

    if (!handle) continue;

    // 2. Extract title
    const title = row.title || row.Title || row['Product Title'] || row.name || row.Name || '';

    // 3. Extract description
    const desc = row.bodyhtml || row['Body (HTML)'] || row.body || row.Description || row.description || '';

    // 4. Extract Category / Type / Tags
    const categoryRaw = row.productcategory || row['Product Category'] || row.category || row.Category || '';
    const typeRaw = row.type || row.Type || row['Product Type'] || '';
    const tagsRaw = row.tags || row.Tags || '';

    // 5. Extract Images
    const imageSrc =
      row.imagesrc ||
      row['Image Src'] ||
      row.image ||
      row.Image ||
      row['Image URL'] ||
      row.img ||
      row.photo ||
      '';

    // 6. Extract Pricing:
    // "Variant Price" or "Cost per item" is the DeoDap wholesale price
    const costRaw =
      row.costperitem ||
      row['Cost per item'] ||
      row.variantprice ||
      row['Variant Price'] ||
      row['Price / India'] ||
      row.cost ||
      row.Cost ||
      row.wholesaleprice ||
      row['Wholesale Price'] ||
      '';

    // "Variant Compare At Price" or "Compare At Price / India" is the MRP
    const mrpRaw =
      row.variantcompareatprice ||
      row['Variant Compare At Price'] ||
      row['Compare At Price / India'] ||
      row.mrp ||
      row.MRP ||
      row.retailprice ||
      row['Retail Price'] ||
      '';

    // 7. Extract SKU
    const sku =
      row.variantsku ||
      row['Variant SKU'] ||
      row.sku ||
      row.SKU ||
      row.itemcode ||
      row['Item Code'] ||
      handle;

    // 8. Extract Stock / Quantity
    const stockRaw =
      row.variantinventoryqty ||
      row['Variant Inventory Qty'] ||
      row.stock ||
      row.Stock ||
      row.qty ||
      row.Quantity ||
      '';

    // 9. Extra columns
    const grams = row.variantgrams || row['Variant Grams'] || 0;
    const barcode = row.variantbarcode || row['Variant Barcode'] || '';
    const vendorName = row.vendor || row.Vendor || 'DeoDap';
    const seoTitle = row.seotitle || row['SEO Title'] || '';
    const seoDescription = row.seodescription || row['SEO Description'] || '';

    if (!productMap.has(handle)) {
      productMap.set(handle, {
        handle,
        title: title || handle,
        description: desc,
        categoryRaw,
        typeRaw,
        tagsRaw,
        images: imageSrc ? [imageSrc] : [],
        costStr: costRaw,
        mrpStr: mrpRaw,
        sku,
        stockStr: stockRaw,
        grams,
        barcode,
        vendorName,
        seoTitle,
        seoDescription,
        rawCsvColumns: { ...row },
      });
    } else {
      const existing = productMap.get(handle);
      if (!existing.title && title) existing.title = title;
      if (!existing.description && desc) existing.description = desc;
      if (imageSrc && !existing.images.includes(imageSrc)) {
        existing.images.push(imageSrc);
      }
      if (!existing.costStr && costRaw) existing.costStr = costRaw;
      if (!existing.mrpStr && mrpRaw) existing.mrpStr = mrpRaw;
      if (!existing.sku && sku) existing.sku = sku;
      if (!existing.stockStr && stockRaw) existing.stockStr = stockRaw;
      // Only copy non-empty fields from subsequent variant rows so we do not overwrite main row values
      for (const [key, val] of Object.entries(row)) {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          existing.rawCsvColumns[key] = val;
        }
      }
    }
  }

  // Ensure Admin user & Flagship store exist for ownership
  let admin = adminUser;
  if (!admin) {
    admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.findOne();
    }
  }

  let store = null;
  if (storeId) {
    store = await Store.findById(storeId);
  }
  if (!store && admin) {
    store = await Store.findOne({ vendor: admin._id });
    if (!store) {
      store = (await Store.findOne({ storeName: /Official Flagship Store/i })) || (await Store.findOne());
    }
  }

  const marginPct = Number(profitMarginPercent) >= 0 ? Number(profitMarginPercent) : 30;
  const shippingAdd = Number(deliveryCharge) >= 0 ? Number(deliveryCharge) : 30;

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const processedProducts = [];

  const defaultPlaceholderImg =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

  for (const [handle, item] of productMap.entries()) {
    // Sanitize Title
    const title = (item.title || handle || 'DeoDap Product')
      .replace(/^"|"$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Sanitize Description
    const description = cleanHtml(item.description);

    // 1. Extract wholesale cost as mentioned in the CSV
    const rawCost = parseFloat(String(item.costStr).replace(/[^0-9.]/g, ''));
    const sourcePrice = !isNaN(rawCost) && rawCost > 0 ? Math.round(rawCost) : 199;

    // 2. Extract MRP / Strike-through price from CSV
    const rawMrp = parseFloat(String(item.mrpStr).replace(/[^0-9.]/g, ''));
    const mrpPrice = !isNaN(rawMrp) && rawMrp > sourcePrice ? Math.round(rawMrp) : Math.round(sourcePrice * 1.8);

    // 3. Selling price: 30% hike on CSV wholesale price + ₹30 delivery charge included
    // e.g. Cost ₹66 -> 30% hike (₹85.80 -> ₹86) + ₹30 delivery = ₹116
    const baseWithMarkup = Math.round(sourcePrice * (1 + marginPct / 100));
    const finalSellingPrice = baseWithMarkup + shippingAdd;
    const profitMargin = Math.max(0, finalSellingPrice - sourcePrice);

    // 4. Stock
    const rawStock = parseInt(String(item.stockStr).replace(/[^0-9]/g, ''), 10);
    const stock = !isNaN(rawStock) && rawStock >= 0 ? rawStock : defaultStock;

    // 5. Detect Category
    const category = detectCategory(item.categoryRaw, item.typeRaw, item.tagsRaw, title);

    // 6. Category-specific dynamic Unsplash backup if Shopify CDN images return 404 or fail
    const categoryFallbacks = {
      'Fitness': [
        'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
      ],
      'Home & Kitchen': [
        'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
      ],
      'Toys': [
        'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
      ],
      'Beauty': [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80',
      ],
      'Electronics': [
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      ],
      'Automotive': [
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
      ],
    };

    const fallbackList = categoryFallbacks[category] || [defaultPlaceholderImg];

    // Preserve all valid images from CSV, and append high-res fallback so the product never renders as a broken blank square
    const validImages = (item.images || []).filter((img) => img && img.startsWith('http'));
    const images = validImages.length > 0 ? Array.from(new Set([...validImages, ...fallbackList])) : fallbackList;

    // 7. Tags
    const tags = (item.tagsRaw || '')
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length < 35);
    if (!tags.includes('deodap')) tags.push('deodap');
    if (!tags.includes('dropship')) tags.push('dropship');
    if (!tags.includes('freedelivery')) tags.push('freedelivery');

    const weightGrams = parseInt(String(item.grams).replace(/[^0-9]/g, ''), 10) || 0;

    // Check if product already exists in database
    let existingProd = await Product.findOne({
      $or: [
        { deodapHandle: handle },
        { sku: item.sku, sourcePlatform: 'deodap' },
        { title: title, sourcePlatform: 'deodap' },
      ],
    });

    if (existingProd) {
      if (updateExisting) {
        existingProd.title = title;
        existingProd.description = description;
        existingProd.sourcePrice = sourcePrice;
        existingProd.costPrice = sourcePrice;
        existingProd.price = finalSellingPrice;
        existingProd.sellingPrice = finalSellingPrice;
        existingProd.discountPrice = mrpPrice;
        existingProd.profitMargin = profitMargin;
        existingProd.deliveryChargeIncluded = shippingAdd;
        existingProd.isFreeDelivery = true;
        existingProd.stock = stock;
        existingProd.category = category;
        existingProd.images = images.length > 0 ? images : existingProd.images;
        existingProd.sku = item.sku || existingProd.sku;
        existingProd.deodapHandle = handle;
        existingProd.sourcePlatform = 'deodap';
        existingProd.isDropshipped = true;
        existingProd.weightGrams = weightGrams;
        existingProd.barcode = item.barcode || existingProd.barcode;
        existingProd.vendorName = item.vendorName || 'DeoDap';
        existingProd.productType = item.typeRaw || existingProd.productType;
        existingProd.seoTitle = item.seoTitle || existingProd.seoTitle;
        existingProd.seoDescription = item.seoDescription || existingProd.seoDescription;
        existingProd.csvData = item.rawCsvColumns || existingProd.csvData;
        existingProd.lastSyncedAt = new Date();
        if (tags.length > 0) existingProd.tags = Array.from(new Set([...(existingProd.tags || []), ...tags]));

        await existingProd.save();
        updatedCount++;
        processedProducts.push(existingProd);
      } else {
        skippedCount++;
      }
    } else {
      // Create new product
      const newProduct = await Product.create({
        title,
        description,
        price: finalSellingPrice,
        sellingPrice: finalSellingPrice,
        discountPrice: mrpPrice,
        sourcePrice,
        costPrice: sourcePrice,
        profitMargin,
        deliveryChargeIncluded: shippingAdd,
        isFreeDelivery: true,
        category,
        stock,
        images,
        vendor: admin ? admin._id : new mongoose.Types.ObjectId(),
        store: store ? store._id : new mongoose.Types.ObjectId(),
        rating: 4.8,
        numReviews: Math.floor(Math.random() * 25) + 5,
        isFeatured: false,
        sourcePlatform: 'deodap',
        sourceUrl: `https://deodap.in/products/${handle}`,
        isDropshipped: true,
        sku: item.sku || `DDP-${handle.slice(0, 15).toUpperCase()}`,
        deodapProductId: handle,
        deodapHandle: handle,
        weightGrams,
        barcode: item.barcode,
        vendorName: item.vendorName || 'DeoDap',
        productType: item.typeRaw,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        csvData: item.rawCsvColumns,
        status: 'active',
        lastSyncedAt: new Date(),
        tags,
      });

      createdCount++;
      processedProducts.push(newProduct);
    }
  }

  // Update PlatformSetting
  try {
    await PlatformSetting.findOneAndUpdate(
      {},
      {
        deodapLastSyncAt: new Date(),
        deodapProfitMarginPercent: marginPct,
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[DeoDap CSV Import] PlatformSetting update warning:', err.message);
  }

  return {
    totalRows: rows.length,
    uniqueProductsInCSV: productMap.size,
    createdCount,
    updatedCount,
    skippedCount,
    profitMarginPercent: marginPct,
    deliveryChargeIncluded: shippingAdd,
    processedProducts: processedProducts.slice(0, 20), // preview first 20
  };
};

module.exports = {
  parseCSV,
  importDeoDapCSV,
  detectCategory,
};
