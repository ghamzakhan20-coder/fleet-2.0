const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deviceId: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    startLocation: {
      latitude: Number,
      longitude: Number,
    },
    endLocation: {
      latitude: Number,
      longitude: Number,
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    maxSpeed: {
      type: Number,
      default: 0,
    },
    avgSpeed: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed'],
      default: 'ongoing',
    },
  },
  { timestamps: true }
);

tripSchema.index({ vehicleId: 1, startTime: -1 });

module.exports = mongoose.model('Trip', tripSchema);
