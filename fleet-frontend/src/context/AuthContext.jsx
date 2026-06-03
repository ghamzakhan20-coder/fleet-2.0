import { createContext, useContext, useState, useEffect } from "react";
import { loginUser } from "../api/services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Always require login on app start by clearing stored auth
  useEffect(() => {
    localStorage.removeItem("fleet_token");
    localStorage.removeItem("fleet_user");
    setLoading(false);
  }, []);

  // Listen for logout events from API interceptor
  useEffect(() => {
    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    const { token: newToken, user: newUser } = res.data;

    localStorage.setItem("fleet_token", newToken);
    localStorage.setItem("fleet_user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem("fleet_token");
    localStorage.removeItem("fleet_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access
export function useAuth() {
  return useContext(AuthContext);
}
