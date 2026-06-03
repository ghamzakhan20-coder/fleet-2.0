import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useVehicles } from "./hooks/useVehicles";
import { useVehicleLogs } from "./hooks/useVehicleLogs";
import LoginPage from "./pages/LoginPage";
import AddVehicleModal from "./components/AddVehicleModal";
import AdminDashboard from "./components/AdminDashboard";

const vehicleIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
      <defs>
        <radialGradient id="pinGrad" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stop-color="#f87171" />
          <stop offset="100%" stop-color="#b91c1c" />
        </radialGradient>
      </defs>
      <path fill="url(#pinGrad)" d="M24 4c-8.8 0-16 7.2-16 16 0 9.8 8 18.1 12 25.9 2.6 4.5 6.1 11.1 7.6 15.2.4 1 1.5 1.7 2.6 1.7s2.2-.7 2.6-1.7c1.5-4.1 5-10.7 7.6-15.2C32 38.1 40 29.8 40 20c0-8.8-7.2-16-16-16z" />
      <circle cx="24" cy="20" r="9" fill="#fff" opacity="0.96" />
      <circle cx="24" cy="20" r="5.2" fill="#ef4444" />
      <circle cx="24" cy="20" r="2.3" fill="#ffffff" />
    </svg>
  `),
  iconSize: [40, 56],
  iconAnchor: [20, 56],
  popupAnchor: [0, -60],
  className: '',
});

const C = {
  primary: "#2563eb", primaryLight: "#eff6ff", bg: "#f0f4f8",
  surface: "#ffffff", surfaceAlt: "#f8fafc", border: "#e2e8f0",
  text: "#0f172a", textMuted: "#64748b", sidebar: "#0f172a",
  success: "#16a34a", successLight: "#f0fdf4",
  warning: "#d97706", warningLight: "#fffbeb",
  danger: "#dc2626", dangerLight: "#fef2f2",
};

// ─── Reusable Components ──────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = {
    moving:    ["#dcfce7", "#15803d", "Moving"],
    idle:      ["#fef9c3", "#a16207", "Idle"],
    stopped:   ["#fee2e2", "#b91c1c", "Stopped"],
    completed: ["#dcfce7", "#15803d", "Completed"],
    ongoing:   ["#dbeafe", "#1d4ed8", "Ongoing"],
    ON:        ["#dcfce7", "#15803d", "ON"],
    OFF:       ["#fee2e2", "#b91c1c", "OFF"],
    IDLE:      ["#fef9c3", "#a16207", "IDLE"],
  };
  const [bg, color, label] = m[status] || m.stopped;
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
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

function ErrorBox({ msg }) {
  return (
    <div style={{ background: C.dangerLight, border: `1px solid #fca5a5`, borderRadius: 10, padding: "14px 18px", color: C.danger, fontSize: 14 }}>
      {msg}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active, setActive, collapsed, user, onLogout }) {
  const items = [
    { id: "dashboard", label: "Dashboard",     path: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "vehicles", label: "Vehicles",       path: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zM13 8h4l3 5v3h-7V8z" },
    { id: "tracking", label: "Live Tracking",  path: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: "trips",    label: "Trip History",   path: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { id: "logs",     label: "Engine Logs",    path: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" },
  ];

  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div style={{ width: collapsed ? 64 : 220, background: C.sidebar, height: "100vh", display: "flex", flexDirection: "column", transition: "width 0.25s", flexShrink: 0 }}>
      <div style={{ padding: collapsed ? "18px 16px" : "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: C.primary, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zM13 8h4l3 5v3h-7V8z" />
          </svg>
        </div>
        {!collapsed && <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>FleetELD</span>}
      </div>

      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {items.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "10px 16px" : "10px 14px", borderRadius: 8, border: "none", background: isActive ? "rgba(37,99,235,0.2)" : "transparent", cursor: "pointer", marginBottom: 2, justifyContent: collapsed ? "center" : "flex-start" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#60a5fa" : "#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d={item.path} />
              </svg>
              {!collapsed && <span style={{ color: isActive ? "#60a5fa" : "#94a3b8", fontSize: 13.5, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: collapsed ? "12px" : "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>{initials}</div>
          {!collapsed && (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ color: "white", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
              <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "capitalize" }}>{user?.role}</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={onLogout} style={{ width: "100%", padding: "7px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer", textAlign: "center" }}>
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function DashboardPage({ vehicles }) {
  const moving  = vehicles.filter(v => v.isActive).length;
  const total   = vehicles.length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Total Vehicles", value: total, color: C.primary },
          { label: "Active Vehicles", value: moving, color: C.success },
          { label: "Inactive", value: total - moving, color: C.danger },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 14 }}>All Vehicles</div>
        {vehicles.length === 0 ? (
          <div style={{ textAlign: "center", color: C.textMuted, padding: "30px 0", fontSize: 14 }}>No vehicles found. Add one to get started.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Vehicle", "Plate", "Device ID", "Owner", "Driver", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px", fontSize: 13, fontWeight: 600, color: C.text }}>{v.model}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: C.textMuted }}>{v.numberPlate}</td>
                  <td style={{ padding: "12px", fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>{v.deviceId}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: C.textMuted }}>{v.ownerId?.name || "—"}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: C.textMuted }}>{v.driverId?.name || "—"}</td>
                  <td style={{ padding: "12px" }}><StatusBadge status={v.isActive ? "moving" : "stopped"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Vehicles Page ────────────────────────────────────────────────────────────

function VehiclesPage({ vehicles, loading, error, onAdd, onDelete, userRole }) {
  const [showModal, setShowModal] = useState(false);

  if (loading) return <Loader />;
  if (error) return <ErrorBox msg={error} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: C.textMuted }}>{vehicles.length} vehicle(s) found</div>
        {(userRole === "admin" || userRole === "owner") && (
          <button onClick={() => setShowModal(true)}
            style={{ background: C.primary, color: "white", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Add Vehicle
          </button>
        )}
      </div>

      {vehicles.length === 0 ? (
        <div style={{ textAlign: "center", color: C.textMuted, padding: "60px 0" }}>No vehicles yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {vehicles.map(v => (
            <div key={v._id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{v.model}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{v.numberPlate}</div>
                </div>
                <StatusBadge status={v.isActive ? "moving" : "stopped"} />
              </div>

              {[["Device ID", v.deviceId], ["Owner", v.ownerId?.name || "—"], ["Driver", v.driverId?.name || "—"]].map(([l, val]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{l}</span>
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{val}</span>
                </div>
              ))}

              {(userRole === "admin" || userRole === "owner") && (
                <button onClick={() => onDelete(v._id)}
                  style={{ marginTop: 14, width: "100%", padding: "7px", borderRadius: 7, border: `1px solid #fca5a5`, background: C.dangerLight, fontSize: 12, cursor: "pointer", color: C.danger, fontWeight: 500 }}>
                  Delete Vehicle
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && <AddVehicleModal onClose={() => setShowModal(false)} onAdd={onAdd} />}
    </div>
  );
}

// ─── Tracking Page ────────────────────────────────────────────────────────────

function TrackingPage({ vehicles }) {
  const [selectedId, setSelectedId] = useState(vehicles[0]?._id || null);
  const { gpsLogs, latestGPS, latestEngine, loading } = useVehicleLogs(selectedId);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 10 }}>Select Vehicle</div>
        {vehicles.map(v => (
          <div key={v._id} onClick={() => setSelectedId(v._id)}
            style={{ background: selectedId === v._id ? C.primaryLight : C.surface, border: `1px solid ${selectedId === v._id ? C.primary : C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{v.model}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{v.numberPlate}</div>
          </div>
        ))}
      </div>

      <div>
        {loading ? <Loader /> : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                ["Speed", latestGPS ? `${latestGPS.speed} km/h` : "—", C.primary],
                ["Location", latestGPS ? `${latestGPS.latitude.toFixed(4)}, ${latestGPS.longitude.toFixed(4)}` : "—", C.success],
                ["Engine", latestEngine?.engineStatus || "—", C.warning],
              ].map(([l, val, col]) => (
                <div key={l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: col, marginTop: 4 }}>{val}</div>
                </div>
              ))}
            </div>

                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 14 }}>Live Map</div>
              {latestGPS ? (
                <div style={{ height: 340, borderRadius: 12, overflow: 'hidden' }}>
                  <MapContainer
                    center={[latestGPS.latitude, latestGPS.longitude]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker
                      position={[latestGPS.latitude, latestGPS.longitude]}
                      icon={vehicleIcon}
                    >
                      <Popup>
                        <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                          <strong>Current position</strong><br />
                          {latestGPS.latitude.toFixed(5)}, {latestGPS.longitude.toFixed(5)}<br />
                          {latestGPS.speed} km/h
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: "40px 0" }}>No live GPS location available yet.</div>
              )}
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 14 }}>Recent GPS Logs</div>
              {gpsLogs.length === 0 ? (
                <div style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No GPS data yet. Run the simulator!</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {["Time", "Latitude", "Longitude", "Speed", "Engine"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "7px 10px", fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gpsLogs.slice(0, 15).map((g, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "9px 10px", fontSize: 12, color: C.textMuted }}>{new Date(g.timestamp).toLocaleTimeString()}</td>
                        <td style={{ padding: "9px 10px", fontSize: 12, color: C.text }}>{g.latitude.toFixed(5)}</td>
                        <td style={{ padding: "9px 10px", fontSize: 12, color: C.text }}>{g.longitude.toFixed(5)}</td>
                        <td style={{ padding: "9px 10px", fontSize: 12, fontWeight: 600, color: C.primary }}>{g.speed} km/h</td>
                        <td style={{ padding: "9px 10px" }}><StatusBadge status={g.engineStatus || "OFF"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Trips Page ───────────────────────────────────────────────────────────────

function TripsPage({ vehicles }) {
  const [selectedId, setSelectedId] = useState(vehicles[0]?._id || null);
  const { trips, loading } = useVehicleLogs(selectedId);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select value={selectedId || ""} onChange={e => setSelectedId(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: "white", outline: "none" }}>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.model} — {v.numberPlate}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
                {["Start Time", "End Time", "Distance", "Max Speed", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "30px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>No trips recorded yet.</td></tr>
              ) : trips.map(t => (
                <tr key={t._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: C.text }}>{new Date(t.startTime).toLocaleString()}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: C.textMuted }}>{t.endTime ? new Date(t.endTime).toLocaleString() : "—"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: C.primary }}>{t.distanceKm} km</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: C.text }}>{t.maxSpeed} km/h</td>
                  <td style={{ padding: "12px 14px" }}><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Engine Logs Page ─────────────────────────────────────────────────────────

function LogsPage({ vehicles }) {
  const [selectedId, setSelectedId] = useState(vehicles[0]?._id || null);
  const { engineLogs, loading } = useVehicleLogs(selectedId);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select value={selectedId || ""} onChange={e => setSelectedId(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: "white", outline: "none" }}>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.model} — {v.numberPlate}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
                {["Time", "Engine", "RPM", "Temp (°C)", "Fuel %", "Battery V", "DTC Codes"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {engineLogs.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "30px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>No engine data yet. Run the simulator!</td></tr>
              ) : engineLogs.slice(0, 20).map((e, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.textMuted }}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding: "10px 14px" }}><StatusBadge status={e.engineStatus} /></td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: C.text }}>{e.rpm}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: e.engineTemp > 100 ? C.danger : C.text }}>{e.engineTemp.toFixed(1)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 50, height: 6, background: C.border, borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${e.fuelLevel}%`, background: e.fuelLevel < 30 ? C.danger : C.success, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: C.textMuted }}>{e.fuelLevel.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: C.text }}>{e.batteryVoltage.toFixed(1)}V</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: e.dtcCodes.length ? C.danger : C.textMuted }}>{e.dtcCodes.length ? e.dtcCodes.join(", ") : "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main App (Inner) ─────────────────────────────────────────────────────────

function InnerApp() {
  const { user, loading: authLoading, logout } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const { vehicles, loading: vehiclesLoading, error, createVehicle, removeVehicle } = useVehicles(!!user && user.role !== "admin");

  const handleLogin = (user) => {
    if (!user) return;
    const landingPage = user.role === "admin"
      ? "admin"
      : user.role === "driver"
        ? "tracking"
        : "dashboard";
    setActivePage(landingPage);
  };

  if (authLoading) return <Loader />;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  // Admin dashboard view
  if (user.role === "admin") {
    return (
      <div style={{ display: "flex", width: "100%", height: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <Sidebar active={activePage} setActive={setActivePage} collapsed={collapsed} user={user} onLogout={logout} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={() => setCollapsed(c => !c)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              </button>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Admin Dashboard</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success }} />
              <span style={{ fontSize: 12, color: C.textMuted }}>Live · Admin Access</span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <AdminDashboard />
          </div>
        </div>
      </div>
    );
  }

  // Regular user dashboard views
  const pageTitles = { dashboard: "Dashboard", vehicles: "Vehicles", tracking: "Live Tracking", trips: "Trip History", logs: "Engine Logs" };

  const renderPage = () => {
    if (vehiclesLoading) return <Loader />;
    if (error) return <ErrorBox msg={error} />;
    switch (activePage) {
      case "dashboard": return <DashboardPage vehicles={vehicles} />;
      case "vehicles":  return <VehiclesPage vehicles={vehicles} loading={vehiclesLoading} error={error} onAdd={createVehicle} onDelete={removeVehicle} userRole={user.role} />;
      case "tracking":  return <TrackingPage vehicles={vehicles} />;
      case "trips":     return <TripsPage vehicles={vehicles} />;
      case "logs":      return <LogsPage vehicles={vehicles} />;
      default:          return <DashboardPage vehicles={vehicles} />;
    }
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar active={activePage} setActive={setActivePage} collapsed={collapsed} user={user} onLogout={logout} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setCollapsed(c => !c)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{pageTitles[activePage]}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success }} />
            <span style={{ fontSize: 12, color: C.textMuted }}>Live · Auto-refresh on</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}
