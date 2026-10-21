const mongoose = require('mongoose');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { mockSettlements, mockUsers, mockTransactions } = require('../config/mockStore');

// @desc    Get all settlements (Admin)
// @route   GET /api/settlements/admin
// @access  Private (Admin)
exports.getAllSettlements = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: mockSettlements.length,
        settlements: mockSettlements,
      });
    }

    const settlements = await Settlement.find()
      .populate('vendor', 'name email phone walletBalance')
      .populate('store', 'storeName phone bankDetails')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: settlements.length,
      settlements,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin process settlement (Approve / Complete / Reject)
// @route   PUT /api/settlements/:id/process
// @access  Private (Admin)
exports.processSettlement = async (req, res, next) => {
  try {
    const { status, transactionReference, adminNotes } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const settlement = mockSettlements.find((s) => s._id === req.params.id);
      if (!settlement) {
        return res.status(404).json({ success: false, message: 'Settlement record not found' });
      }

      settlement.status = status;
      if (transactionReference) settlement.transactionReference = transactionReference;
      if (adminNotes) settlement.adminNotes = adminNotes;
      if (status === 'completed') settlement.settledAt = new Date();

      if (status === 'rejected') {
        const vendor = mockUsers.find((u) => u._id === settlement.vendor._id || u._id === settlement.vendor);
        if (vendor) vendor.walletBalance += settlement.amount;
      }

      return res.status(200).json({
        success: true,
        message: `Settlement status updated to ${status}`,
        settlement,
      });
    }

    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement record not found' });
    }

    if (settlement.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Settlement is already completed' });
    }

    settlement.status = status;
    if (transactionReference) settlement.transactionReference = transactionReference;
    if (adminNotes) settlement.adminNotes = adminNotes;

    if (status === 'completed') {
      settlement.settledAt = new Date();
      await WalletTransaction.findOneAndUpdate(
        { referenceId: settlement._id.toString(), type: 'settlement_payout' },
        { status: 'completed' }
      );
    } else if (status === 'rejected') {
      const vendorUser = await User.findById(settlement.vendor);
      if (vendorUser) {
        vendorUser.walletBalance += settlement.amount;
        await vendorUser.save();

        await WalletTransaction.create({
          vendor: vendorUser._id,
          type: 'admin_adjustment',
          amount: settlement.amount,
          description: `Settlement #${settlement._id.toString().substring(0, 8)} rejected: ${adminNotes || 'Refunded to wallet'}`,
          referenceId: settlement._id.toString(),
          status: 'completed',
          balanceAfter: vendorUser.walletBalance,
        });
      }
    }

    await settlement.save();

    res.status(200).json({
      success: true,
      message: `Settlement status updated to ${status}`,
      settlement,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get vendor's settlements
// @route   GET /api/settlements/vendor/mine
// @access  Private (Vendor)
exports.getVendorSettlements = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: mockSettlements.length,
        settlements: mockSettlements,
      });
    }

    const settlements = await Settlement.find({ vendor: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: settlements.length,
      settlements,
    });
  } catch (err) {
    next(err);
  }
};
