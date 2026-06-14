const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { successResponse, errorResponse } = require('../utils/responseHelper');

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

// @desc    Delete owner user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 404, 'User not found.');
    }

    if (user.role !== 'owner') {
      return errorResponse(res, 400, 'Only owner users can be removed from this dashboard.');
    }

    const vehicleCount = await Vehicle.countDocuments({ ownerId: user._id });
    if (vehicleCount > 0) {
      return errorResponse(res, 400, 'Owner cannot be removed while they still have assigned vehicles. Reassign or remove their vehicles first.');
    }

    await user.deleteOne();
    successResponse(res, 200, 'Owner removed successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsersWithVehicles, deleteUser };