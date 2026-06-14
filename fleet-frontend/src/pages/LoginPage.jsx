import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import DriverVehicleModal from "../components/DriverVehicleModal";

const C = {
  primary: "#2563eb", bg: "#f0f4f8", border: "#e2e8f0",
  text: "#0f172a", textMuted: "#64748b", danger: "#dc2626",
};

export default function LoginPage({ onLogin }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", role: "owner" });
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [verifiedVehicle, setVerifiedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password, form.role);
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // <div style={{ 
    //   minHeight: "100vh", 
    //   background: C.bg, 
    //   display: "flex", 
    //   alignItems: "center", 
    //   justifyContent: "center",
    //   padding: "16px",
    // }}>
    <div style={{ 
  height: "100vh",      /* minHeight → height */
  width: "100%",        /* yeh add karo */
  background: C.bg, 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center",
  padding: "16px",
}}>
      <style>{`
        @media (max-width: 480px) {
          .login-container {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div className="login-container" style={{ 
        background: "white", 
        border: `1px solid ${C.border}`, 
        borderRadius: 16, 
        padding: "clamp(24px, 5vw, 40px) clamp(20px, 5vw, 36px)", 
        width: 380,
        maxWidth: "100%",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)" 
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, background: C.primary, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zM13 8h4l3 5v3h-7V8z" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: C.text }}>FleetELD</span>
        </div>

        <h1 style={{ fontSize: "clamp(18px, 5vw, 22px)", fontWeight: 700, color: C.text, marginBottom: 4 }}>Welcome back</h1>
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 28 }}>Sign in to your fleet dashboard</p>

        {error && (
          <div style={{ 
            background: "#fef2f2", 
            border: "1px solid #fca5a5", 
            borderRadius: 8, 
            padding: "10px 14px", 
            fontSize: 13, 
            color: C.danger, 
            marginBottom: 18,
            animation: "slideIn 0.3s ease"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: C.text, display: "block", marginBottom: 6 }}>Email</label>
            <input
              type="email" 
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ali@example.com"
              style={{ 
                width: "100%", 
                padding: "10px 14px", 
                border: `1px solid ${C.border}`, 
                borderRadius: 8, 
                fontSize: 14, 
                color: C.text, 
                outline: "none",
                boxSizing: "border-box",
                backgroundColor: "#ffffff"
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: C.text, display: "block", marginBottom: 6 }}>Role</label>
            <select
              required
              value={form.role}
              onChange={(e) => {
                const nextRole = e.target.value;
                setForm({ ...form, role: nextRole });
                setVerifiedVehicle(null);
                setShowDriverModal(nextRole === "driver");
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 14,
                color: C.text,
                outline: "none",
                boxSizing: "border-box",
                backgroundColor: "#ffffff"
              }}
            >
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="driver">User</option>
            </select>
          </div>

          {verifiedVehicle && (
            <div style={{
              marginBottom: 16,
              padding: 14,
              borderRadius: 12,
              background: "#f8fbff",
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Verified vehicle</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{verifiedVehicle.model} · {verifiedVehicle.numberPlate}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{verifiedVehicle.driverId?.name ? `Driver: ${verifiedVehicle.driverId.name}` : "Driver not assigned"}</div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: C.text, display: "block", marginBottom: 6 }}>Password</label>
            <input
              type="password" 
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              style={{ 
                width: "100%", 
                padding: "10px 14px", 
                border: `1px solid ${C.border}`, 
                borderRadius: 8, 
                fontSize: 14, 
                color: C.text, 
                outline: "none",
                boxSizing: "border-box",
                backgroundColor: "#ffffff"
              }}
            />
          </div>

          <button
            type="submit" 
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "11px", 
              background: loading ? "#93c5fd" : C.primary, 
              color: "white", 
              border: "none", 
              borderRadius: 9, 
              fontSize: 14, 
              fontWeight: 600, 
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {showDriverModal && (
          <DriverVehicleModal
            initialPlate={form.numberPlate || ""}
            onClose={() => setShowDriverModal(false)}
            onVerified={(vehicle) => setVerifiedVehicle(vehicle)}
          />
        )}

        <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", marginTop: 20 }}>
          Roles: <strong>admin</strong> · <strong>owner</strong> · <strong>driver</strong>
        </p>
      </div>
    </div>
  );
}
