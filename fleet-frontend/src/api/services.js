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

export const getVehicleByPlate = (plate) =>
  api.get(`/vehicles/plate/${encodeURIComponent(plate)}`);

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

export const getPublicGPSLogs = (plate, page = 1, limit = 50) =>
  api.get(`/logs/public/gps/${encodeURIComponent(plate)}?page=${page}&limit=${limit}`);

export const getPublicEngineLogs = (plate, page = 1, limit = 50) =>
  api.get(`/logs/public/engine/${encodeURIComponent(plate)}?page=${page}&limit=${limit}`);

export const getTrips = (vehicleId) =>
  api.get(`/logs/trips/${vehicleId}`);

// ─── ESP32 SIMULATOR (for testing) ───────────────────────────────────────────

export const sendSimulatedData = (data) =>
  api.post("/vehicle-data", data);

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export const getUsersWithVehicles = () =>
  api.get("/admin/users-with-vehicles");
export const deleteUser = (userId) =>
  api.delete(`/admin/users/${encodeURIComponent(userId)}`);
// ─── NOTIFICATIONS ────────────────────────────────────────────────────────

export const getMyNotifications = (limit = 50) =>
  api.get(`/notifications?limit=${limit}`);

export const markNotificationAsRead = (id) =>
  api.patch(`/notifications/${id}/read`);

