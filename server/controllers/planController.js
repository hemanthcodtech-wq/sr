const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const { mockPlans } = require('../config/mockStore');

// @desc    Get all active subscription plans
// @route   GET /api/plans
// @access  Public
exports.getPlans = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: mockPlans.length,
        plans: mockPlans.filter((p) => p.isActive),
      });
    }

    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all plans (Admin)
// @route   GET /api/plans/admin
// @access  Private (Admin)
exports.getAllPlansAdmin = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: mockPlans.length,
        plans: mockPlans,
      });
    }

    const plans = await Plan.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single plan by ID
// @route   GET /api/plans/:id
// @access  Public
exports.getPlanById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const plan = mockPlans.find((p) => p._id === req.params.id);
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
      return res.status(200).json({ success: true, plan });
    }

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.status(200).json({
      success: true,
      plan,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new subscription plan
// @route   POST /api/plans
// @access  Private (Admin)
exports.createPlan = async (req, res, next) => {
  try {
    const { title, price, durationDays, description, features, productLimit, badge } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const newPlan = {
        _id: `plan_${Date.now()}`,
        title,
        price: Number(price),
        durationDays: Number(durationDays),
        description,
        features: Array.isArray(features) ? features : features ? features.split(',').map((f) => f.trim()) : [],
        productLimit: Number(productLimit) || 50,
        badge: badge || '',
        isActive: true,
      };
      mockPlans.push(newPlan);
      return res.status(201).json({ success: true, plan: newPlan });
    }

    const plan = await Plan.create({
      title,
      price,
      durationDays,
      description,
      features: Array.isArray(features) ? features : features ? features.split(',').map((f) => f.trim()) : [],
      productLimit: productLimit || 50,
      badge: badge || '',
    });

    res.status(201).json({
      success: true,
      plan,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update subscription plan
// @route   PUT /api/plans/:id
// @access  Private (Admin)
exports.updatePlan = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const idx = mockPlans.findIndex((p) => p._id === req.params.id);
      if (idx !== -1) {
        mockPlans[idx] = { ...mockPlans[idx], ...req.body };
        return res.status(200).json({ success: true, plan: mockPlans[idx] });
      }
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    res.status(200).json({
      success: true,
      plan,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete subscription plan
// @route   DELETE /api/plans/:id
// @access  Private (Admin)
exports.deletePlan = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const idx = mockPlans.findIndex((p) => p._id === req.params.id);
      if (idx !== -1) {
        mockPlans.splice(idx, 1);
        return res.status(200).json({ success: true, message: 'Plan deleted' });
      }
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
