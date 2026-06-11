import { useEffect, useState, useCallback } from "react";
import { getMyNotifications, markNotificationAsRead } from "../api/services";

export function useNotifications(pollMs = 5000) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);
      const res = await getMyNotifications(50);
      // API returns { success, data }
      setNotifications(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(false), pollMs);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollMs]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const readOne = async (id) => {
    await markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  return { notifications, unreadCount, loading, error, refresh: fetchNotifications, readOne };
}

