const express = require('express');
const router = express.Router();
const {
  addVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getVehicles)
  .post(protect, authorize('admin', 'owner'), addVehicle);

router
  .route('/:id')
  .get(protect, getVehicleById)
  .put(protect, authorize('admin', 'owner'), updateVehicle)
  .delete(protect, authorize('admin', 'owner'), deleteVehicle);

module.exports = router;
