const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['overspeed', 'low_fuel', 'engine_overheat'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    dedupeKey: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ ownerId: 1, vehicleId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

