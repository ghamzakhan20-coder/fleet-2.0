const Notification = require('../models/Notification');
const Vehicle = require('../models/Vehicle');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// @desc    Get notifications for current owner
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;

    if (req.user.role !== 'owner') {
      return errorResponse(res, 403, 'Access denied.');
    }

    const notifications = await Notification.find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    successResponse(res, 200, 'Notifications fetched.', notifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'owner') {
      return errorResponse(res, 403, 'Access denied.');
    }

    const notification = await Notification.findOne({ _id: id, ownerId: req.user.id });
    if (!notification) {
      return errorResponse(res, 404, 'Notification not found.');
    }

    notification.isRead = true;
    await notification.save();

    successResponse(res, 200, 'Notification marked as read.', notification);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
};

