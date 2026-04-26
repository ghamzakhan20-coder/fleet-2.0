const mongoose = require('mongoose');

const gpsLogSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number,         // km/h
      default: 0,
    },
    altitude: {
      type: Number,         // meters
      default: 0,
    },
    heading: {
      type: Number,         // degrees
      default: 0,
    },
    satellites: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for fast queries by vehicle and time
gpsLogSchema.index({ vehicleId: 1, timestamp: -1 });
gpsLogSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('GPSLog', gpsLogSchema);
