const User = require('../models/User');
const { sendTokenResponse } = require('../utils/tokenHelper');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'Email already registered.');
    }

    // Create user (password hashed in model pre-save hook)
    const user = await User.create({ name, email, password, role, phone });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email and password.');
    }

    // Get user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    successResponse(res, 200, 'User fetched successfully.', user);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
