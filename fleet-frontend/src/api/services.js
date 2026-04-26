import api from "./axiosInstance";

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const registerUser = (data) =>
  api.post("/auth/register", data);

export const loginUser = (data) =>
  api.post("/auth/login", data);

export const getMe = () =>
  api.get("/auth/me");

// ─── VEHICLES ────────────────────────────────────────────────────────────────

export const getVehicles = () =>
  api.get("/vehicles");

export const getVehicleById = (id) =>
  api.get(`/vehicles/${id}`);

export const addVehicle = (data) =>
  api.post("/vehicles", data);

export const updateVehicle = (id, data) =>
  api.put(`/vehicles/${id}`, data);

export const deleteVehicle = (id) =>
  api.delete(`/vehicles/${id}`);

// ─── LOGS ────────────────────────────────────────────────────────────────────

export const getGPSLogs = (vehicleId, page = 1, limit = 50) =>
  api.get(`/logs/gps/${vehicleId}?page=${page}&limit=${limit}`);

export const getEngineLogs = (vehicleId, page = 1, limit = 50) =>
  api.get(`/logs/engine/${vehicleId}?page=${page}&limit=${limit}`);

export const getTrips = (vehicleId) =>
  api.get(`/logs/trips/${vehicleId}`);

// ─── ESP32 SIMULATOR (for testing) ───────────────────────────────────────────

export const sendSimulatedData = (data) =>
  api.post("/vehicle-data", data);
