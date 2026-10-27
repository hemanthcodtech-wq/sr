const deodapService = require('../services/deodapService');

// @desc    Get DeoDap dropshipping connection status, settings & stats
// @route   GET /api/deodap/stats
// @access  Private (Admin)
exports.getDeoDapStatsController = async (req, res, next) => {
  try {
    const stats = await deodapService.getDeoDapStats();
    res.status(200).json({
      success: true,
      stats,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Trigger automatic synchronization of DeoDap catalog
// @route   POST /api/deodap/sync
// @access  Private (Admin)
exports.syncDeoDapCatalogController = async (req, res, next) => {
  try {
    const { limit = 60, profitMarginPercent = 30, category = 'all' } = req.body;
    const result = await deodapService.syncDeoDapCatalog({
      limit: Number(limit) || 60,
      profitMarginPercent: Number(profitMarginPercent) || 30,
      category,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update profit margin percentage across all DeoDap catalog products
// @route   PUT /api/deodap/profit-margin
// @access  Private (Admin)
exports.updateProfitMarginController = async (req, res, next) => {
  try {
    const { profitMarginPercent } = req.body;
    if (profitMarginPercent === undefined || Number(profitMarginPercent) < 0) {
      return res.status(400).json({ success: false, message: 'Please specify a valid profit margin percentage' });
    }

    const result = await deodapService.updateProfitMarginAll(profitMarginPercent);
    res.status(200).json({
      success: true,
      message: `Profit margin updated to ${profitMarginPercent}% across ${result.updatedCount} DeoDap products!`,
      result,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Preview live DeoDap products feed
// @route   GET /api/deodap/preview
// @access  Private (Admin)
exports.previewDeoDapProducts = async (req, res, next) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const products = await deodapService.fetchDeoDapProducts({
      limit: Number(limit) || 10,
      page: Number(page) || 1,
    });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    next(err);
  }
};

