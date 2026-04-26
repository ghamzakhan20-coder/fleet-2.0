const Vehicle = require('../models/Vehicle');
const GPSLog = require('../models/GPSLog');
const EngineLog = require('../models/EngineLog');
const Trip = require('../models/Trip');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// Helper: calculate distance between two GPS coords (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// @desc    Receive data from ESP32 device
// @route   POST /api/vehicle-data
// @access  Public (device sends data, no auth needed on this route)
const receiveVehicleData = async (req, res, next) => {
  try {
    const {
      deviceId,
      // GPS fields
      latitude,
      longitude,
      speed,
      altitude,
      heading,
      satellites,
      // Engine fields
      engineStatus,
      rpm,
      engineTemp,
      fuelLevel,
      batteryVoltage,
      obdSpeed,
      dtcCodes,
    } = req.body;

    if (!deviceId) {
      return errorResponse(res, 400, 'deviceId is required.');
    }

    // Find vehicle by deviceId
    const vehicle = await Vehicle.findOne({ deviceId, isActive: true });
    if (!vehicle) {
      return errorResponse(res, 404, `No active vehicle found for deviceId: ${deviceId}`);
    }

    const now = new Date();

    // Save GPS log
    let gpsLog = null;
    if (latitude !== undefined && longitude !== undefined) {
      gpsLog = await GPSLog.create({
        vehicleId: vehicle._id,
        deviceId,
        latitude,
        longitude,
        speed: speed || 0,
        altitude: altitude || 0,
        heading: heading || 0,
        satellites: satellites || 0,
        timestamp: now,
      });
    }

    // Save Engine log
    let engineLog = null;
    if (engineStatus !== undefined) {
      engineLog = await EngineLog.create({
        vehicleId: vehicle._id,
        deviceId,
        engineStatus,
        rpm: rpm || 0,
        engineTemp: engineTemp || 0,
        fuelLevel: fuelLevel || 0,
        batteryVoltage: batteryVoltage || 0,
        obdSpeed: obdSpeed || 0,
        dtcCodes: dtcCodes || [],
        timestamp: now,
      });
    }

    // ─── Auto Trip Detection ───────────────────────────────────────────────
    let activeTrip = await Trip.findOne({ vehicleId: vehicle._id, status: 'ongoing' });

    if (engineStatus === 'ON' && !activeTrip) {
      // Engine turned ON → start new trip
      activeTrip = await Trip.create({
        vehicleId: vehicle._id,
        driverId: vehicle.driverId,
        deviceId,
        startTime: now,
        startLocation: { latitude, longitude },
        status: 'ongoing',
      });
    } else if (engineStatus === 'OFF' && activeTrip) {
      // Engine turned OFF → complete the trip
      const distanceKm = activeTrip.startLocation
        ? calculateDistance(
            activeTrip.startLocation.latitude,
            activeTrip.startLocation.longitude,
            latitude,
            longitude
          )
        : 0;

      await Trip.findByIdAndUpdate(activeTrip._id, {
        endTime: now,
        endLocation: { latitude, longitude },
        status: 'completed',
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        maxSpeed: speed || 0,
      });
    } else if (activeTrip && speed !== undefined) {
      // Update max speed during ongoing trip
      if (speed > (activeTrip.maxSpeed || 0)) {
        await Trip.findByIdAndUpdate(activeTrip._id, { maxSpeed: speed });
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    successResponse(res, 200, 'Vehicle data received successfully.', {
      vehicleId: vehicle._id,
      gpsLog,
      engineLog,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get GPS logs by vehicleId
// @route   GET /api/logs/gps/:vehicleId
// @access  Private
const getGPSLogs = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { limit = 100, page = 1 } = req.query;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return errorResponse(res, 404, 'Vehicle not found.');

    // Access control
    if (req.user.role === 'owner' && vehicle.ownerId.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, 'Access denied.');
    }
    if (req.user.role === 'driver' && vehicle.driverId?.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, 'Access denied.');
    }

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await GPSLog.find({ vehicleId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await GPSLog.countDocuments({ vehicleId });

    successResponse(res, 200, 'GPS logs fetched.', {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Engine logs by vehicleId
// @route   GET /api/logs/engine/:vehicleId
// @access  Private
const getEngineLogs = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { limit = 100, page = 1 } = req.query;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return errorResponse(res, 404, 'Vehicle not found.');

    // Access control
    if (req.user.role === 'owner' && vehicle.ownerId.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, 'Access denied.');
    }
    if (req.user.role === 'driver' && vehicle.driverId?.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, 'Access denied.');
    }

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await EngineLog.find({ vehicleId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await EngineLog.countDocuments({ vehicleId });

    successResponse(res, 200, 'Engine logs fetched.', {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trip history by vehicleId
// @route   GET /api/logs/trips/:vehicleId
// @access  Private
const getTripsByVehicle = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return errorResponse(res, 404, 'Vehicle not found.');

    if (req.user.role === 'owner' && vehicle.ownerId.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, 'Access denied.');
    }
    if (req.user.role === 'driver' && vehicle.driverId?.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, 'Access denied.');
    }

    const trips = await Trip.find({ vehicleId })
      .sort({ startTime: -1 })
      .populate('driverId', 'name email');

    successResponse(res, 200, 'Trips fetched.', trips);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  receiveVehicleData,
  getGPSLogs,
  getEngineLogs,
  getTripsByVehicle,
};
