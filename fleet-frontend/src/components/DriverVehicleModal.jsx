import { useState, useEffect } from "react";
import { getVehicleByPlate, getGPSLogs, getEngineLogs, getPublicGPSLogs, getPublicEngineLogs } from "../api/services";

const C = {
  primary: "#2563eb",
  border: "#e2e8f0",
  surface: "#ffffff",
  surfaceAlt: "#f8fafc",
  text: "#0f172a",
  textMuted: "#64748b",
  success: "#16a34a",
  danger: "#dc2626",
  dangerLight: "#fef2f2",
};

function StatusBadge({ status }) {
  const palettes = {
    active: ["#dcfce7", "#15803d", "Active"],
    inactive: ["#fee2e2", "#b91c1c", "Inactive"],
    ON: ["#dcfce7", "#15803d", "ON"],
    OFF: ["#fee2e2", "#b91c1c", "OFF"],
    IDLE: ["#fef9c3", "#a16207", "IDLE"],
  };
  const [bg, color, label] = palettes[status] || ["#f0f4f8", "#64748b", status || "Unknown"];

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "6px 12px",
      borderRadius: 20,
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 600,
      minWidth: 72,
    }}>
      {label}
    </span>
  );
}

function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.primary}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DataTable({ items, columns }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
          {columns.map((col) => (
            <th key={col.label} style={{ textAlign: "left", padding: "10px 0", fontWeight: 700, color: C.textMuted }}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((row, index) => (
          <tr key={index} style={{ borderBottom: `1px solid ${C.border}` }}>
            {columns.map((col) => (
              <td key={col.label} style={{ padding: "10px 0", color: C.text }}>
                {col.render ? col.render(row) : col.value ? col.value(row) : row[col.key] ?? "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DriverVehicleModal({ onClose, onVerified, initialPlate = "" }) {
  const [plate, setPlate] = useState(initialPlate);
  const [vehicle, setVehicle] = useState(null);
  const [gpsLogs, setGpsLogs] = useState([]);
  const [engineLogs, setEngineLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState("");
  const [logError, setLogError] = useState("");

  useEffect(() => {
    if (!vehicle) {
      setGpsLogs([]);
      setEngineLogs([]);
      setLogError("");
      return;
    }

    const fetchLogs = async () => {
      setLogsLoading(true);
      setLogError("");

      try {
        const token = localStorage.getItem("fleet_token");
        const plate = vehicle.numberPlate || vehicle.plate || vehicle.number;

        if (token) {
          const [gpsRes, engineRes] = await Promise.all([
            getGPSLogs(vehicle._id, 1, 8),
            getEngineLogs(vehicle._id, 1, 8),
          ]);

          setGpsLogs(gpsRes.data.data?.logs || []);
          setEngineLogs(engineRes.data.data?.logs || []);
          return;
        }

        if (!plate) {
          setGpsLogs([]);
          setEngineLogs([]);
          setLogError("Vehicle logs require login to view.");
          return;
        }

        const [gpsRes, engineRes] = await Promise.all([
          getPublicGPSLogs(plate, 1, 8),
          getPublicEngineLogs(plate, 1, 8),
        ]);

        setGpsLogs(gpsRes.data.data?.logs || []);
        setEngineLogs(engineRes.data.data?.logs || []);
      } catch (err) {
        console.error(err);
        const message =
          err.response?.data?.message ||
          "Failed to load vehicle logs.";
        setGpsLogs([]);
        setEngineLogs([]);
        setLogError(message);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchLogs();
  }, [vehicle]);

  const handleSearch = async (event) => {
    event.preventDefault();
    setError("");
    setVehicle(null);
    const normalized = plate.trim().toUpperCase();

    if (!normalized) {
      setError("Enter a registered vehicle number.");
      return;
    }

    setLoading(true);
    try {
      const res = await getVehicleByPlate(normalized);
      const data = res.data.data;
      setVehicle(data);
      onVerified(data);
    } catch (err) {
      setError(err.response?.data?.message || "Vehicle not found.");
    } finally {
      setLoading(false);
    }
  };

  const latestGPS = gpsLogs[0];
  const mapCenter = latestGPS ? [latestGPS.latitude, latestGPS.longitude] : [24.8607, 67.0011];
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter[1] - 0.02}%2C${mapCenter[0] - 0.01}%2C${mapCenter[1] + 0.02}%2C${mapCenter[0] + 0.01}&layer=mapnik&marker=${mapCenter[0]}%2C${mapCenter[1]}`;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 16,
    }}>
      <div style={{
        width: "90%",
        maxWidth: 800,
        background: C.surface,
        borderRadius: 12,
        padding: 24,
        maxHeight: "95vh",
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Vehicle Details</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: C.textMuted }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, marginBottom: 24, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Search registered vehicle number to load details</div>
          </div>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "end" }}>
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="KHI-1234"
              style={{
                minWidth: 240,
                width: "100%",
                maxWidth: 320,
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: C.surfaceAlt,
                color: C.text,
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 18px",
                borderRadius: 10,
                border: "none",
                background: loading ? "#93c5fd" : C.primary,
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                minWidth: 110,
              }}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {error && (
          <div style={{ background: C.dangerLight, border: `1px solid #fca5a5`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: C.danger, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {vehicle && (
          <>
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Vehicle Name</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{vehicle.model}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Registration Number</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{vehicle.numberPlate}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Device ID</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: "monospace" }}>{vehicle.deviceId}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Status</div>
                  <StatusBadge status={vehicle.isActive ? "active" : "inactive"} />
                </div>
              </div>
            </div>

            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Owner</div>
                <div style={{ fontSize: 13, color: C.text }}>{vehicle.owner?.name || vehicle.ownerId?.name || vehicle.owner?.email || vehicle.ownerId?.email || "Unknown"}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{vehicle.owner?.email || vehicle.ownerId?.email || ""}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Assigned Driver</div>
                <div style={{ fontSize: 13, color: C.text }}>{vehicle.driver?.name || vehicle.driverId?.name || vehicle.driver?.email || vehicle.driverId?.email || "Not assigned"}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{vehicle.driver?.email || vehicle.driverId?.email || ""}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Live Location</div>
              <div style={{ height: 280, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <iframe
                  title="vehicle-live-location"
                  src={mapUrl}
                  style={{ width: "100%", height: "100%", border: 0 }}
                />
              </div>
            </div>

            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Recent GPS Logs</div>
              {logsLoading ? (
                <Loader />
              ) : logError ? (
                <div style={{ fontSize: 13, color: C.danger, padding: 10, borderRadius: 10, background: C.dangerLight, marginBottom: 8 }}>
                  {logError}
                </div>
              ) : gpsLogs.length ? (
                <DataTable
                  items={gpsLogs.slice(0, 8)}
                  columns={[
                    { label: "Time", value: (row) => new Date(row.timestamp).toLocaleTimeString() },
                    { label: "Latitude", value: (row) => row.latitude.toFixed(5) },
                    { label: "Longitude", value: (row) => row.longitude.toFixed(5) },
                    { label: "Speed", value: (row) => `${row.speed} km/h` },
                    { label: "Engine", render: (row) => <StatusBadge status={row.engineStatus || "OFF"} /> },
                  ]}
                />
              ) : (
                <div style={{ fontSize: 13, color: C.textMuted }}>No GPS logs available.</div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Recent Engine Logs</div>
              {logsLoading ? (
                <Loader />
              ) : logError ? (
                <div style={{ fontSize: 13, color: C.danger, padding: 10, borderRadius: 10, background: C.dangerLight, marginBottom: 8 }}>
                  {logError}
                </div>
              ) : engineLogs.length ? (
                <DataTable
                  items={engineLogs.slice(0, 8)}
                  columns={[
                    { label: "Time", value: (row) => new Date(row.timestamp).toLocaleTimeString() },
                    { label: "Status", render: (row) => <StatusBadge status={row.engineStatus || "OFF"} /> },
                    { label: "RPM", value: (row) => row.rpm },
                    { label: "Temp", value: (row) => `${row.engineTemp.toFixed(1)}°` },
                    { label: "Fuel", value: (row) => `${row.fuelLevel.toFixed(0)}%` },
                    { label: "Battery", value: (row) => `${row.batteryVoltage.toFixed(1)}V` },
                    { label: "DTC Codes", value: (row) => row.dtcCodes?.length ? row.dtcCodes.join(", ") : "None" },
                  ]}
                />
              ) : (
                <div style={{ fontSize: 13, color: C.textMuted }}>No engine logs available.</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button type="button" onClick={onClose} style={{
                flex: 1,
                padding: "10px 16px",
                background: C.primary,
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
