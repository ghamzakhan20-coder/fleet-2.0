const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { successResponse } = require('../utils/responseHelper');

// @desc    Get all users with their associated vehicles
// @route   GET /api/admin/users-with-vehicles
// @access  Admin
const getUsersWithVehicles = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').lean();
    const vehicles = await Vehicle.find()
      .populate('ownerId', 'name email phone role')
      .populate('driverId', 'name email phone role')
      .lean();

    const usersById = users.reduce((acc, user) => {
      acc[user._id.toString()] = {
        ...user,
        vehiclesOwned: [],
        vehiclesAssigned: [],
      };
      return acc;
    }, {});

    vehicles.forEach((vehicle) => {
      const ownerId = vehicle.ownerId?._id?.toString();
      const driverId = vehicle.driverId?._id?.toString();
      const vehicleDetails = {
        _id: vehicle._id,
        deviceId: vehicle.deviceId,
        model: vehicle.model,
        numberPlate: vehicle.numberPlate,
        isActive: vehicle.isActive,
        owner: vehicle.ownerId || null,
        driver: vehicle.driverId || null,
      };

      if (ownerId && usersById[ownerId]) {
        usersById[ownerId].vehiclesOwned.push(vehicleDetails);
      }
      if (driverId && usersById[driverId]) {
        usersById[driverId].vehiclesAssigned.push(vehicleDetails);
      }
    });

    successResponse(res, 200, 'Users with vehicles fetched.', Object.values(usersById));
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsersWithVehicles };