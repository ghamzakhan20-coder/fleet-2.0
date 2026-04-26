import { useState } from "react";

const C = { primary: "#2563eb", border: "#e2e8f0", text: "#0f172a", textMuted: "#64748b", danger: "#dc2626" };

export default function AddVehicleModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ deviceId: "", model: "", numberPlate: "", driverId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onAdd(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add vehicle.");
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, placeholder, type = "text") => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: C.text, display: "block", marginBottom: 5 }}>{label}</label>
      <input
        type={type} 
        value={form[key]} 
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        style={{ 
          width: "100%", 
          padding: "9px 12px", 
          border: `1px solid ${C.border}`, 
          borderRadius: 7, 
          fontSize: 13, 
          color: C.text, 
          outline: "none", 
          boxSizing: "border-box",
          backgroundColor: "#ffffff"
        }}
      />
    </div>
  );

  return (
    <div style={{ 
      position: "fixed", 
      inset: 0, 
      background: "rgba(0,0,0,0.4)", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      zIndex: 1000,
      padding: "16px",
      backdropFilter: "blur(2px)"
    }}>
      <style>{`
        @media (max-width: 480px) {
          .modal-content {
            width: 100% !important;
            max-width: 100% !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
        }
        
        .modal-content {
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="modal-content" style={{ 
        background: "white", 
        borderRadius: 14, 
        padding: "clamp(20px, 5vw, 28px)", 
        width: 420,
        maxWidth: "100%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>Add New Vehicle</h2>
          <button 
            onClick={onClose} 
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              fontSize: 24, 
              color: C.textMuted, 
              lineHeight: 1,
              padding: 0,
              transition: "color 0.2s ease"
            }}
            onMouseEnter={(e) => e.target.style.color = C.text}
            onMouseLeave={(e) => e.target.style.color = C.textMuted}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{ 
            background: "#fef2f2", 
            border: "1px solid #fca5a5", 
            borderRadius: 7, 
            padding: "9px 12px", 
            fontSize: 13, 
            color: C.danger, 
            marginBottom: 14,
            animation: "slideIn 0.3s ease"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {field("Device ID", "deviceId", "ESP32-001")}
          {field("Vehicle Model", "model", "Toyota Hilux 2022")}
          {field("Number Plate", "numberPlate", "KHI-1234")}
          {field("Driver ID (optional)", "driverId", "MongoDB ObjectId")}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ 
                flex: 1, 
                padding: "10px", 
                borderRadius: 8, 
                border: `1px solid ${C.border}`, 
                background: "white", 
                fontSize: 13, 
                cursor: "pointer", 
                color: C.textMuted, 
                fontWeight: 500,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "white";
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                flex: 1, 
                padding: "10px", 
                borderRadius: 8, 
                border: "none", 
                background: loading ? "#93c5fd" : C.primary, 
                color: "white", 
                fontSize: 13, 
                fontWeight: 600, 
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {loading ? "Adding..." : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
