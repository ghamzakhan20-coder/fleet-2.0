import { useState, useEffect } from "react";
import { getGPSLogs, getEngineLogs, getTrips } from "../api/services";

export function useVehicleLogs(vehicleId) {
  const [gpsLogs, setGpsLogs]       = useState([]);
  const [engineLogs, setEngineLogs] = useState([]);
  const [trips, setTrips]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (!vehicleId) return;

    const fetchAll = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      setError(null);
      try {
        const [gpsRes, engineRes, tripsRes] = await Promise.all([
          getGPSLogs(vehicleId),
          getEngineLogs(vehicleId),
          getTrips(vehicleId),
        ]);
        setGpsLogs(gpsRes.data.data.logs);
        setEngineLogs(engineRes.data.data.logs);
        setTrips(tripsRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load logs.");
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchAll(true);

    // Refresh logs every 10 seconds for live feel
    const interval = setInterval(() => fetchAll(false), 5000);
    return () => clearInterval(interval);
  }, [vehicleId]);

  // Latest GPS point
  const latestGPS = gpsLogs[0] || null;

  // Latest engine reading
  const latestEngine = engineLogs[0] || null;

  return { gpsLogs, engineLogs, trips, latestGPS, latestEngine, loading, error };
}
