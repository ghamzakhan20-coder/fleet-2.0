const express = require('express');
const router = express.Router();
const {
  receiveVehicleData,
  getGPSLogs,
  getEngineLogs,
  getTripsByVehicle,
} = require('../controllers/logController');
const { protect } = require('../middleware/authMiddleware');

// ESP32 sends data here (no auth — device uses deviceId to identify itself)
router.post('/vehicle-data', receiveVehicleData);

// Protected log routes
router.get('/gps/:vehicleId', protect, getGPSLogs);
router.get('/engine/:vehicleId', protect, getEngineLogs);
router.get('/trips/:vehicleId', protect, getTripsByVehicle);

module.exports = router;
