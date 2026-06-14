const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getUsersWithVehicles, deleteUser } = require('../controllers/adminController');

router.get('/users-with-vehicles', protect, authorize('admin'), getUsersWithVehicles);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;