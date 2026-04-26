// Vehicle Data Simulator
// Simulates ESP32 sending data every 5 seconds
// Run: node simulator.js

const deviceId = "ESP32-001"; // Change this to match your vehicle's deviceId
const API_URL = "http://localhost:5000/api/vehicle-data";

// Karachi coordinates base (your city!)
const BASE_LAT = 24.8607;
const BASE_LNG = 67.0011;

let engineOn = true;

function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(4));
}

function generateData() {
  // Toggle engine status randomly every ~30 seconds
  if (Math.random() < 0.05) engineOn = !engineOn;

  const engineStatus = engineOn ? "ON" : "OFF";

  return {
    deviceId,

    // GPS — small random drift around Karachi
    latitude:  BASE_LAT + randomBetween(-0.05, 0.05),
    longitude: BASE_LNG + randomBetween(-0.05, 0.05),
    speed:     engineOn ? randomBetween(0, 120) : 0,
    altitude:  randomBetween(5, 20),
    heading:   randomBetween(0, 360),
    satellites: Math.floor(randomBetween(5, 12)),

    // Engine / OBD
    engineStatus,
    rpm:            engineOn ? randomBetween(700, 4000) : 0,
    engineTemp:     engineOn ? randomBetween(75, 105)   : randomBetween(20, 40),
    fuelLevel:      randomBetween(10, 100),
    batteryVoltage: randomBetween(11.5, 14.5),
    obdSpeed:       engineOn ? randomBetween(0, 120)    : 0,
    dtcCodes:       Math.random() < 0.1 ? ["P0301"] : [], // 10% chance of fault code
  };
}

async function sendData() {
  const payload = generateData();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log(`[${new Date().toLocaleTimeString()}] ✅ Sent | Engine: ${payload.engineStatus} | Speed: ${payload.speed} km/h | GPS: (${payload.latitude}, ${payload.longitude})`);

    if (!response.ok) {
      console.error("  ❌ Server error:", data.message);
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Failed to reach server:`, err.message);
    console.error("  Make sure your backend is running on", API_URL);
  }
}

console.log("🚗 Vehicle Simulator Started");
console.log(`📡 Sending data to: ${API_URL}`);
console.log(`🔑 Device ID: ${deviceId}`);
console.log("⏱  Interval: every 5 seconds\n");

// Send immediately then every 5 seconds
sendData();
setInterval(sendData, 5000);