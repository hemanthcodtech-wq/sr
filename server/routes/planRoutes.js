const express = require('express');
const router = express.Router();
const {
  getPlans,
  getAllPlansAdmin,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controllers/planController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getPlans);
router.get('/admin', protect, authorize('admin'), getAllPlansAdmin);
router.get('/:id', getPlanById);
router.post('/', protect, authorize('admin'), createPlan);
router.put('/:id', protect, authorize('admin'), updatePlan);
router.delete('/:id', protect, authorize('admin'), deletePlan);

module.exports = router;
