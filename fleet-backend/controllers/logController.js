const Vehicle = require('../models/Vehicle');
const GPSLog = require('../models/GPSLog');
const EngineLog = require('../models/EngineLog');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
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
        engineStatus: engineStatus || 'OFF',
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

    // ─── Vehicle Alerts (Owner App Notifications) ─────────────────────────
    const SPEED_THRESHOLD_KMH = 80;
    const LOW_FUEL_THRESHOLD_PERCENT = 20;
    const ENGINE_OVERHEAT_TEMP_C = 95;
    const ALERT_DEDUPE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

    const speedValue = typeof speed === 'number' ? speed : Number(speed ?? 0);
    const fuelValue = typeof fuelLevel === 'number' ? fuelLevel : Number(fuelLevel ?? 0);
    const engineTempValue =
      typeof engineTemp === 'number' ? engineTemp : Number(engineTemp ?? 0);

    const ownerId = vehicle.ownerId;

    const maybeCreateAlert = async ({ type, title, message, dedupeKey }) => {
      // Throttle duplicates by checking latest notification within window
      const recent = await Notification.findOne({
        ownerId,
        vehicleId: vehicle._id,
        type,
        dedupeKey,
      })
        .sort({ createdAt: -1 })
        .exec();

      if (recent) {
        const age = now.getTime() - recent.createdAt.getTime();
        if (age < ALERT_DEDUPE_WINDOW_MS) return;
      }

      await Notification.create({
        ownerId,
        vehicleId: vehicle._id,
        type,
        title,
        message,
        dedupeKey,
      });
    };

    if (speedValue > SPEED_THRESHOLD_KMH) {
      await maybeCreateAlert({
        type: 'overspeed',
        title: 'Overspeed Alert',
        message: `Vehicle ${vehicle.numberPlate} speed crossed ${SPEED_THRESHOLD_KMH} km/h (Current: ${speedValue} km/h).`,
        dedupeKey: `speed:${SPEED_THRESHOLD_KMH}`,
      });
    }


    if (fuelValue > 0 && fuelValue < LOW_FUEL_THRESHOLD_PERCENT) {
      await maybeCreateAlert({
        type: 'low_fuel',
        title: 'Low Fuel Alert',
        message: `Vehicle ${vehicle.numberPlate} fuel is low (${fuelValue}% remaining). Threshold: ${LOW_FUEL_THRESHOLD_PERCENT}%.`,
        dedupeKey: `fuel:${LOW_FUEL_THRESHOLD_PERCENT}`,
      });
    }

    if (engineTempValue > 0 && engineTempValue > ENGINE_OVERHEAT_TEMP_C) {
      await maybeCreateAlert({
        type: 'engine_overheat',
        title: 'Engine Overheat Alert',
        message: `Vehicle ${vehicle.numberPlate} engine temperature high (${engineTempValue}°C). Threshold: ${ENGINE_OVERHEAT_TEMP_C}°C.`,
        dedupeKey: `temp:${ENGINE_OVERHEAT_TEMP_C}`,
      });
    }
    // ────────────────────────────────────────────────────────────────────────

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
        maxSpeed: speedValue || 0,
      });
    } else if (activeTrip && speed !== undefined) {
      // Update max speed during ongoing trip
      if (speedValue > (activeTrip.maxSpeed || 0)) {
        await Trip.findByIdAndUpdate(activeTrip._id, { maxSpeed: speedValue });
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

// @desc    Get public GPS logs by plate
// @route   GET /api/logs/public/gps/:plate
// @access  Public
const getPublicGPSLogs = async (req, res, next) => {
  try {
    const plate = req.params.plate?.trim().toUpperCase();
    const { limit = 100, page = 1 } = req.query;

    const vehicle = await Vehicle.findOne({ numberPlate: plate, isActive: true });
    if (!vehicle) return errorResponse(res, 404, 'Vehicle not found.');

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await GPSLog.find({ vehicleId: vehicle._id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await GPSLog.countDocuments({ vehicleId: vehicle._id });

    successResponse(res, 200, 'Vehicle GPS logs fetched.', {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public engine logs by plate
// @route   GET /api/logs/public/engine/:plate
// @access  Public
const getPublicEngineLogs = async (req, res, next) => {
  try {
    const plate = req.params.plate?.trim().toUpperCase();
    const { limit = 100, page = 1 } = req.query;

    const vehicle = await Vehicle.findOne({ numberPlate: plate, isActive: true });
    if (!vehicle) return errorResponse(res, 404, 'Vehicle not found.');

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await EngineLog.find({ vehicleId: vehicle._id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await EngineLog.countDocuments({ vehicleId: vehicle._id });

    successResponse(res, 200, 'Vehicle engine logs fetched.', {
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
  getPublicGPSLogs,
  getPublicEngineLogs,
  getTripsByVehicle,
};
