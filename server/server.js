const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to Database
const connectDB = require('./config/db');
connectDB();

const app = express();

// Middlewares
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Route Imports
const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const settlementRoutes = require('./routes/settlementRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');
const couponRoutes = require('./routes/couponRoutes');
const deodapRoutes = require('./routes/deodapRoutes');
const errorHandler = require('./middleware/errorHandler');
const { syncDeoDapCatalog } = require('./services/deodapService');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/deodap', deodapRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Amezon.online Multi-Vendor Marketplace API',
    customerPortal: 'active',
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] Amezon.online Multi-Vendor Backend running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Health Check: http://localhost:${PORT}/api/health`);

  // Auto-fetch DeoDap products on startup (after DB connects)
  setTimeout(async () => {
    try {
      console.log('[DeoDap Auto-Sync] Checking and synchronizing dropship catalog from DeoDap...');
      const margin = process.env.DEODAP_DEFAULT_PROFIT_MARGIN_PERCENT || 30;
      const syncResult = await syncDeoDapCatalog({ limit: 40, profitMarginPercent: margin });
      console.log(`[DeoDap Auto-Sync] Completed: ${syncResult.totalFetched} products fetched, ${syncResult.createdCount} new, ${syncResult.updatedCount} refreshed.`);
    } catch (err) {
      console.warn('[DeoDap Auto-Sync Warning] Initial sync note:', err.message);
    }
  }, 4000);

  // Periodic Auto-Sync every 12 hours (43200000 ms)
  setInterval(async () => {
    try {
      console.log('[DeoDap Auto-Sync Interval] Refreshing catalog and wholesale prices...');
      const margin = process.env.DEODAP_DEFAULT_PROFIT_MARGIN_PERCENT || 30;
      await syncDeoDapCatalog({ limit: 40, profitMarginPercent: margin });
    } catch (err) {
      console.warn('[DeoDap Interval Warning]:', err.message);
    }
  }, 12 * 60 * 60 * 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Server Error] ${err.message}`);
});
