import { useState, useEffect, useCallback } from "react";
import {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from "../api/services";

export function useVehicles(enabled = false) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchVehicles = useCallback(async (isInitial = false) => {
    if (!enabled) return;
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const res = await getVehicles();
      setVehicles(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vehicles.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setVehicles([]);
      setError(null);
      setLoading(false);
      return;
    }

    fetchVehicles(true);
    // Poll every 10 seconds for live updates
    const interval = setInterval(() => fetchVehicles(false), 10000);
    return () => clearInterval(interval);
  }, [fetchVehicles, enabled]);

  const createVehicle = async (data) => {
    const res = await addVehicle(data);
    setVehicles((prev) => [...prev, res.data.data]);
    return res.data.data;
  };

  const editVehicle = async (id, data) => {
    const res = await updateVehicle(id, data);
    setVehicles((prev) =>
      prev.map((v) => (v._id === id ? res.data.data : v))
    );
    return res.data.data;
  };

  const removeVehicle = async (id) => {
    await deleteVehicle(id);
    setVehicles((prev) => prev.filter((v) => v._id !== id));
  };

  return { vehicles, loading, error, refetch: fetchVehicles, createVehicle, editVehicle, removeVehicle };
}
