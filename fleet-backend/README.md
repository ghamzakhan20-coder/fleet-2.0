# 🚗 Smart ELD Fleet Management — Backend API

Node.js + Express.js + MongoDB backend for the Smart ELD Tracking FYP.

---

## 📁 Folder Structure

```
fleet-backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, login, getMe
│   ├── vehicleController.js   # CRUD for vehicles
│   └── logController.js       # ESP32 data + GPS/Engine logs
├── middleware/
│   ├── authMiddleware.js      # JWT protect + role authorize
│   └── errorMiddleware.js     # Global error handler
├── models/
│   ├── User.js                # User schema (admin/owner/driver)
│   ├── Vehicle.js             # Vehicle schema
│   ├── GPSLog.js              # GPS data logs
│   ├── EngineLog.js           # OBD/Engine data logs
│   └── Trip.js                # Auto-generated trip records
├── routes/
│   ├── authRoutes.js
│   ├── vehicleRoutes.js
│   └── logRoutes.js
├── utils/
│   ├── tokenHelper.js         # JWT generate + send response
│   └── responseHelper.js      # Standard success/error responses
├── .env.example
├── .gitignore
├── index.js                   # App entry point
└── package.json
```

---

## ⚙️ Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env` file
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/fleet_management
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
```

### 3. Run server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

---

## 🔑 API Endpoints

Base URL: `http://localhost:5000/api`

---

### AUTH

| Method | Endpoint           | Access  | Description          |
|--------|--------------------|---------|----------------------|
| POST   | /auth/register     | Public  | Register new user    |
| POST   | /auth/login        | Public  | Login & get token    |
| GET    | /auth/me           | Private | Get logged-in user   |

#### Register
```json
POST /api/auth/register
{
  "name": "Ali Khan",
  "email": "ali@example.com",
  "password": "123456",
  "role": "owner",
  "phone": "0300-1234567"
}
```

#### Login
```json
POST /api/auth/login
{
  "email": "ali@example.com",
  "password": "123456"
}
```
Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "64abc...",
    "name": "Ali Khan",
    "email": "ali@example.com",
    "role": "owner"
  }
}
```

---

### VEHICLES

All vehicle routes require: `Authorization: Bearer <token>` header

| Method | Endpoint          | Roles            | Description              |
|--------|-------------------|------------------|--------------------------|
| POST   | /vehicles         | admin, owner     | Add vehicle              |
| GET    | /vehicles         | all              | Get vehicles (role-based)|
| GET    | /vehicles/:id     | all              | Get single vehicle       |
| PUT    | /vehicles/:id     | admin, owner     | Update vehicle           |
| DELETE | /vehicles/:id     | admin, owner     | Delete vehicle           |

#### Add Vehicle
```json
POST /api/vehicles
Headers: Authorization: Bearer <token>
{
  "deviceId": "ESP32-001",
  "model": "Toyota Hilux 2022",
  "numberPlate": "KHI-1234",
  "ownerId": "64abc123...",   // only admin needs this field
  "driverId": "64def456..."   // optional
}
```

---

### LOGS & ESP32 DATA

#### ✅ ESP32 Sends Data (No Auth Required)
```json
POST /api/vehicle-data
{
  "deviceId": "ESP32-001",

  // GPS data
  "latitude": 24.8607,
  "longitude": 67.0011,
  "speed": 60,
  "altitude": 10,
  "heading": 180,
  "satellites": 8,

  // Engine / OBD data
  "engineStatus": "ON",
  "rpm": 2500,
  "engineTemp": 90,
  "fuelLevel": 75,
  "batteryVoltage": 12.6,
  "obdSpeed": 58,
  "dtcCodes": []
}
```
✔ Automatically saves GPS log  
✔ Automatically saves Engine log  
✔ Automatically detects trip start/end based on engineStatus  

---

#### Get GPS Logs
```
GET /api/logs/gps/:vehicleId?page=1&limit=50
Headers: Authorization: Bearer <token>
```

#### Get Engine Logs
```
GET /api/logs/engine/:vehicleId?page=1&limit=50
Headers: Authorization: Bearer <token>
```

#### Get Trip History
```
GET /api/logs/trips/:vehicleId
Headers: Authorization: Bearer <token>
```

---

## 🔐 Role-Based Access

| Feature               | Admin | Owner | Driver |
|-----------------------|-------|-------|--------|
| See all vehicles      | ✅    | ❌    | ❌     |
| See own vehicles      | ✅    | ✅    | ❌     |
| See assigned vehicle  | ✅    | ✅    | ✅     |
| Add vehicle           | ✅    | ✅    | ❌     |
| Update/Delete vehicle | ✅    | ✅*   | ❌     |
| View GPS logs         | ✅    | ✅*   | ✅*    |
| View engine logs      | ✅    | ✅*   | ✅*    |

*Only for their own/assigned vehicles

---

## 🧪 Test With Postman (Quick Start)

1. Register a user → copy token
2. Add a vehicle → copy vehicleId
3. Send simulated ESP32 data → POST /api/vehicle-data
4. View logs → GET /api/logs/gps/:vehicleId

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcryptjs
- **Dev**: nodemon
