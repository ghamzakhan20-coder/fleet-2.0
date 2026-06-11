// Vehicle Data Simulator
// Smooth Route Simulation
// Run: node simulator.js

const deviceId = "ESP32-001";
const API_URL = "http://localhost:5000/api/vehicle-data";

// Main Route
const ROUTE = [
  { lat: 24.964724, lng: 67.053618 },
  { lat: 24.964458, lng: 67.053713 },
  { lat: 24.964188, lng: 67.053717 },
  { lat: 24.963903, lng: 67.053743 },
  { lat: 24.963658, lng: 67.053771 },
  { lat: 24.963286, lng: 67.053817 },
  { lat: 24.962812, lng: 67.053833 },
  { lat: 24.962612, lng: 67.053665 }
];

// Generate smooth path
function generateSmoothRoute(route, stepsPerSegment = 20) {
  const smoothRoute = [];

  for (let i = 0; i < route.length - 1; i++) {
    const start = route[i];
    const end = route[i + 1];

    for (let step = 0; step < stepsPerSegment; step++) {
      const t = step / stepsPerSegment;

      smoothRoute.push({
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t,
      });
    }
  }

  smoothRoute.push(route[route.length - 1]);

  return smoothRoute;
}

const SMOOTH_ROUTE = generateSmoothRoute(ROUTE, 20);

let currentIndex = 0;

function randomBetween(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function getNextLocation() {
  const point = SMOOTH_ROUTE[currentIndex];

  currentIndex++;

  // Loop forever
  if (currentIndex >= SMOOTH_ROUTE.length) {
    currentIndex = 0;
  }

  return point;
}

function generateData() {
  const location = getNextLocation();

  return {
    deviceId,

    latitude: location.lat,
    longitude: location.lng,

    speed: randomBetween(25, 45),
    altitude: randomBetween(5, 15),
    heading: randomBetween(0, 360),
    satellites: Math.floor(randomBetween(8, 12)),

    engineStatus: "ON",
    rpm: randomBetween(1500, 2800),
    engineTemp: randomBetween(82, 92),
    fuelLevel: randomBetween(55, 85),
    batteryVoltage: randomBetween(12.4, 14.0),
    obdSpeed: randomBetween(25, 45),

    dtcCodes: [],
  };
}

async function sendData() {
  const payload = generateData();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(
      `[${new Date().toLocaleTimeString()}] 📍 ${payload.latitude.toFixed(
        6
      )}, ${payload.longitude.toFixed(6)} | ${payload.speed} km/h`
    );

    if (!response.ok) {
      console.error("❌ Server Error");
    }
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
}

console.log("🚗 Smooth Route Simulator Started");
console.log(`📡 ${API_URL}`);
console.log(`🛣 Route Points: ${SMOOTH_ROUTE.length}`);
console.log("🔄 Infinite Loop Enabled");

sendData();

// 2 sec interval = smooth tracking
setInterval(sendData, 2000);