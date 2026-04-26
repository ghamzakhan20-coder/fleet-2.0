import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, getMe } from "../api/services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(localStorage.getItem("fleet_token"));
  const [loading, setLoading] = useState(true);

  // On app load: if token exists, fetch user profile
  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const res = await getMe();
          setUser(res.data.data);
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    init();
  }, [token]);

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
