import { useState, useEffect, useCallback } from "react";
import {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from "../api/services";

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchVehicles = useCallback(async (isInitial = false) => {
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
  }, []);

  useEffect(() => {
    fetchVehicles(true);
    // Poll every 10 seconds for live updates
    const interval = setInterval(() => fetchVehicles(false), 10000);
    return () => clearInterval(interval);
  }, [fetchVehicles]);

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
