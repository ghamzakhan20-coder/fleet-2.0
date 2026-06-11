const Vehicle = require('../models/Vehicle');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// @desc    Add new vehicle
// @route   POST /api/vehicles
// @access  Admin, Owner
const addVehicle = async (req, res, next) => {
  try {
    const { deviceId, model, numberPlate, ownerId, driverId, type } = req.body;

    // If owner is adding, force ownerId to be themselves
    const resolvedOwnerId =
      req.user.role === 'admin' ? ownerId || req.user.id : req.user.id;

    const vehicle = await Vehicle.create({
      deviceId,
      model,
      numberPlate,
      ownerId: resolvedOwnerId,
      driverId: driverId || null,
      type: type || 'live'  
    });

    successResponse(res, 201, 'Vehicle added successfully.', vehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Get vehicles (role-based)
// @route   GET /api/vehicles
// @access  Private (all roles)
const getVehicles = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'owner') {
      query = { ownerId: req.user.id };
    } else if (req.user.role === 'driver') {
      query = { driverId: req.user.id };
    }
    // admin: no filter, sees all vehicles

    const vehicles = await Vehicle.find(query)
      .populate('ownerId', 'name email phone')
      .populate('driverId', 'name email phone');

    successResponse(res, 200, 'Vehicles fetched.', vehicles);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('ownerId', 'name email phone')
      .populate('driverId', 'name email phone');

    if (!vehicle) {
      return errorResponse(res, 404, 'Vehicle not found.');
    }

    // Drivers can only see their assigned vehicle
    if (
      req.user.role === 'driver' &&
      vehicle.driverId?.toString() !== req.user.id.toString()
    ) {
      return errorResponse(res, 403, 'Access denied.');
    }

    // Owners can only see their own vehicles
    if (
      req.user.role === 'owner' &&
      vehicle.ownerId?.toString() !== req.user.id.toString()
    ) {
      return errorResponse(res, 403, 'Access denied.');
    }

    successResponse(res, 200, 'Vehicle fetched.', vehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Admin, Owner
const updateVehicle = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return errorResponse(res, 404, 'Vehicle not found.');
    }

    // Owner can only update their own vehicles
    if (
      req.user.role === 'owner' &&
      vehicle.ownerId.toString() !== req.user.id.toString()
    ) {
      return errorResponse(res, 403, 'Access denied.');
    }

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    successResponse(res, 200, 'Vehicle updated.', vehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Admin, Owner
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return errorResponse(res, 404, 'Vehicle not found.');
    }

    // Owner can only delete their own vehicles
    if (
      req.user.role === 'owner' &&
      vehicle.ownerId.toString() !== req.user.id.toString()
    ) {
      return errorResponse(res, 403, 'Access denied.');
    }

    await vehicle.deleteOne();

    successResponse(res, 200, 'Vehicle deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};
