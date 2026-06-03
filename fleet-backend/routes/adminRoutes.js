const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getUsersWithVehicles } = require('../controllers/adminController');

router.get('/users-with-vehicles', protect, authorize('admin'), getUsersWithVehicles);

module.exports = router;