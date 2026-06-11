# Fleet Management Project Features Report

## 1. Overview
Yeh project ek full-stack fleet management system hai jisme backend Node.js + Express + MongoDB par bana hua hai aur frontend React (Create React App) use karta hai.

## 2. Backend Features

- Authentication
  - User registration (`/api/auth/register`)
  - User login (`/api/auth/login`)
  - Get current user (`/api/auth/me`)
  - JWT based auth + role-based access control

- Vehicle Management
  - Add vehicle
  - Update vehicle
  - Delete vehicle
  - List vehicles
  - Fetch single vehicle
  - Role control: admin / owner / driver ke hisaab se access restricted

- Vehicle Data Ingestion
  - ESP32 simulator / device se data receive karna (`POST /api/vehicle-data`)
  - GPS logs store karna
  - Engine logs store karna
  - Trip detection
    - Engine ON pe trip start
    - Engine OFF pe trip complete
    - Ongoing trip max speed update

- Log APIs
  - GPS logs retrieval (`GET /api/logs/gps/:vehicleId`)
  - Engine logs retrieval (`GET /api/logs/engine/:vehicleId`)
  - Trip history retrieval (`GET /api/logs/trips/:vehicleId`)

- Data Models
  - User model (admin, owner, driver)
  - Vehicle model
  - GPSLog model
  - EngineLog model
  - Trip model

- Utilities
  - Standard success/error response helper
  - JWT token helper
  - Global error handling middleware
  - CORS setup for frontend origins

## 3. Frontend Features

- Authentication UI
  - Login page with role selection
  - Auth context management

- Dashboard & Navigation
  - Sidebar navigation
  - Pages: Dashboard, Vehicles, Live Tracking, Trip History, Engine Logs

- Vehicle Management UI
  - Vehicle listing
  - Add vehicle modal
  - Delete vehicle action for admin/owner
  - Vehicle cards and details display

- Live Tracking
  - Vehicle selector
  - Live GPS status display
  - Map rendering with React Leaflet
  - Latest GPS coordinates, speed, engine status
  - Recent GPS log table

- Trip History
  - Trip list for selected vehicle
  - Display start/end time, distance, max speed, status

- Engine Logs UI
  - Engine log table
  - Display engine status, RPM, temperature, fuel, battery voltage, DTC codes

- Data Fetching Hooks
  - `useVehicles` for vehicles list + create/update/delete
  - `useVehicleLogs` for GPS, engine, and trip logs
  - Auto-refresh for live data

## 4. Simulator

- `fleet-backend/simulator.js` contains a smooth route simulator
- Simulator sends repeated vehicle payloads to backend at `/api/vehicle-data`
- Payload includes:
  - `latitude`, `longitude`, `speed`, `altitude`, `heading`, `satellites`
  - `engineStatus`, `rpm`, `engineTemp`, `fuelLevel`, `batteryVoltage`, `obdSpeed`, `dtcCodes`
- Useful for testing live tracking and log ingestion

## 5. Key Capabilities

- Live fleet tracking with map visualization
- Historical trip generation from engine status
- Separate GPS vs engine log storage
- Role-aware vehicle and log access
- Full CRUD for vehicles
- Backend API ready for real device integration

## 6. Notes

- Frontend is built with Create React App
- Backend exposes a health-check at `/`
- CORS is configured for local frontend and deployed origins
- The project already has a UI improvements summary file in `UI_IMPROVEMENTS_SUMMARY.md`

---

Yeh report aapke current project ke major features ko outline karti hai. Agar aap chaho to main isme use case, tech stack, aur missing features ka bhi detailed breakdown add kar sakta hoon.