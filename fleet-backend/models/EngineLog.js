const mongoose = require('mongoose');

const engineLogSchema = new mongoose.Schema(
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
    engineStatus: {
      type: String,
      enum: ['ON', 'OFF', 'IDLE'],
      default: 'OFF',
    },
    rpm: {
      type: Number,
      default: 0,
    },
    engineTemp: {
      type: Number,   // Celsius
      default: 0,
    },
    fuelLevel: {
      type: Number,   // percentage 0-100
      default: 0,
    },
    batteryVoltage: {
      type: Number,   // Volts
      default: 0,
    },
    obdSpeed: {
      type: Number,   // km/h from OBD
      default: 0,
    },
    dtcCodes: {
      type: [String], // Diagnostic Trouble Codes
      default: [],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

engineLogSchema.index({ vehicleId: 1, timestamp: -1 });
engineLogSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('EngineLog', engineLogSchema);
