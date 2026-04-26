import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import AddVehicleModal from "./components/AddVehicleModal";

const COLORS = {
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  primaryDark: "#1e40af",
  bg: "#f0f4f8",
  surface: "#ffffff",
  surfaceAlt: "#f8fafc",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  success: "#16a34a",
  successLight: "#f0fdf4",
  warning: "#d97706",
  warningLight: "#fffbeb",
  danger: "#dc2626",
  dangerLight: "#fef2f2",
  sidebar: "#0f172a",
  sidebarText: "#94a3b8",
  sidebarActive: "#2563eb",
};

const mockVehicles = [
  { id: "V001", name: "Toyota Hilux", plate: "KHI-1234", driver: "Ahmed Raza", status: "moving", speed: 67, fuel: 78, engine: "ON", lat: 24.8721, lng: 67.0311 },
  { id: "V002", name: "Honda City", plate: "KHI-5678", driver: "Sara Khan", status: "idle", speed: 0, fuel: 45, engine: "IDLE", lat: 24.8607, lng: 67.0011 },
  { id: "V003", name: "Suzuki Carry", plate: "KHI-9012", driver: "Bilal Ahmed", status: "stopped", speed: 0, fuel: 22, engine: "OFF", lat: 24.8850, lng: 67.0450 },
  { id: "V004", name: "Toyota Corolla", plate: "KHI-3456", driver: "Zara Ali", status: "moving", speed: 43, fuel: 91, engine: "ON", lat: 24.8500, lng: 66.9900 },
];

const mockTrips = [
  { id: "T001", vehicle: "Toyota Hilux", driver: "Ahmed Raza", start: "Saddar", end: "Gulshan", distance: "12.4 km", duration: "28 min", date: "Today, 10:30 AM", status: "completed" },
  { id: "T002", vehicle: "Honda City", driver: "Sara Khan", start: "DHA", end: "Clifton", distance: "8.7 km", duration: "19 min", date: "Today, 09:15 AM", status: "completed" },
  { id: "T003", vehicle: "Toyota Corolla", driver: "Zara Ali", start: "Korangi", end: "Malir", distance: "5.2 km", duration: "—", date: "Today, 11:00 AM", status: "ongoing" },
  { id: "T004", vehicle: "Suzuki Carry", driver: "Bilal Ahmed", start: "SITE", end: "Orangi", distance: "15.1 km", duration: "41 min", date: "Yesterday, 3:00 PM", status: "completed" },
];

const mockAlerts = [
  { id: 1, type: "danger", vehicle: "Suzuki Carry", msg: "Low fuel — 22% remaining", time: "5 min ago" },
  { id: 2, type: "warning", vehicle: "Toyota Hilux", msg: "Overspeed detected — 87 km/h in 60 zone", time: "12 min ago" },
  { id: 3, type: "warning", vehicle: "Honda City", msg: "Engine idle for 25+ minutes", time: "30 min ago" },
  { id: 4, type: "danger", vehicle: "Suzuki Carry", msg: "DTC Code: P0301 — Engine misfire", time: "1 hr ago" },
];

const gpsHistory = [
  { lat: 24.8607, lng: 67.0011, speed: 45, time: "11:00" },
  { lat: 24.8650, lng: 67.0080, speed: 62, time: "11:05" },
  { lat: 24.8700, lng: 67.0150, speed: 71, time: "11:10" },
  { lat: 24.8721, lng: 67.0311, speed: 67, time: "11:15" },
];

function StatusBadge({ status }) {
  const cfg = {
    moving: { bg: "#dcfce7", color: "#15803d", label: "Moving" },
    idle: { bg: "#fef9c3", color: "#a16207", label: "Idle" },
    stopped: { bg: "#fee2e2", color: "#b91c1c", label: "Stopped" },
    completed: { bg: "#dcfce7", color: "#15803d", label: "Completed" },
    ongoing: { bg: "#dbeafe", color: "#1d4ed8", label: "Ongoing" },
  };
  const c = cfg[status] || cfg.stopped;
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, letterSpacing: 0.3 }}>
      {c.label}
    </span>
  );
}

function AlertIcon({ type }) {
  return (
    <div style={{ width: 32, height: 32, borderRadius: "50%", background: type === "danger" ? COLORS.dangerLight : COLORS.warningLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={type === "danger" ? COLORS.danger : COLORS.warning} strokeWidth="2.5" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
  );
}

function Sidebar({ active, setActive, collapsed }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "vehicles", label: "Vehicles", icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zM13 8h4l3 5v3h-7V8z" },
    { id: "tracking", label: "Live Tracking", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: "trips", label: "Trip History", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { id: "alerts", label: "Alerts", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  ];

  return (
    <div style={{ 
      width: collapsed ? 64 : 220, 
      background: COLORS.sidebar, 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      transition: "width 0.25s ease", 
      flexShrink: 0, 
      position: "relative" 
    }}>
      <style>{`
        @media (max-width: 768px) {
          .sidebar-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            height: 100vh !important;
            z-index: 999 !important;
            box-shadow: 2px 0 8px rgba(0,0,0,0.15) !important;
          }
        }
      `}</style>
      <div style={{ padding: collapsed ? "20px 16px" : "20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: COLORS.primary, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zM13 8h4l3 5v3h-7V8z" />
          </svg>
        </div>
        {!collapsed && <span style={{ color: "white", fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>FleetELD</span>}
      </div>
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {items.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActive(item.id)}
            style={{ 
              width: "100%", 
              display: "flex", 
              alignItems: "center", 
              gap: 12, 
              padding: collapsed ? "10px 16px" : "10px 14px", 
              borderRadius: 8, 
              border: "none", 
              background: active === item.id ? "rgba(37,99,235,0.2)" : "transparent", 
              cursor: "pointer", 
              marginBottom: 2, 
              transition: "background 0.15s ease",
              justifyContent: collapsed ? "center" : "flex-start"
            }}
            onMouseEnter={(e) => {
              if (active !== item.id) {
                e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (active !== item.id) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke={active === item.id ? "#60a5fa" : COLORS.sidebarText} 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ flexShrink: 0, transition: "stroke 0.15s ease" }}>
              <path d={item.icon} />
            </svg>
            {!collapsed && <span style={{ color: active === item.id ? "#60a5fa" : COLORS.sidebarText, fontSize: 13.5, fontWeight: active === item.id ? 600 : 400, transition: "color 0.15s ease" }}>{item.label}</span>}
            {!collapsed && item.id === "alerts" && <span style={{ marginLeft: "auto", background: COLORS.danger, color: "white", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>4</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding: collapsed ? "16px" : "16px 20px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 }}>AK</div>
        {!collapsed && (
          <div>
            <div style={{ color: "white", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Ali Khan</div>
            <div style={{ color: COLORS.sidebarText, fontSize: 11 }}>Fleet Owner</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  );
}

function MiniMap({ vehicles, selected }) {
  const vehicle = vehicles.find(v => v.id === selected) || vehicles[0];
  const dots = vehicles.map(v => ({
    ...v,
    x: ((v.lng - 66.95) / 0.15) * 100,
    y: 100 - ((v.lat - 24.83) / 0.08) * 100,
  }));

  return (
    <div style={{ background: "#e8f0fe", borderRadius: 10, overflow: "hidden", position: "relative", height: 220 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#c7d7fc" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="#dde8fe" />
        <rect width="100" height="100" fill="url(#grid)" />
        <path d="M 20 50 Q 40 30 60 50 T 90 40" stroke="#b8caf8" strokeWidth="1.5" fill="none" />
        <path d="M 10 70 L 90 70" stroke="#b8caf8" strokeWidth="1" />
        <path d="M 50 10 L 50 90" stroke="#b8caf8" strokeWidth="1" />
        {dots.map(v => (
          <g key={v.id}>
            <circle cx={v.x} cy={v.y} r="3.5" fill={v.status === "moving" ? "#16a34a" : v.status === "idle" ? "#d97706" : "#dc2626"} />
            <circle cx={v.x} cy={v.y} r="6" fill={v.status === "moving" ? "#16a34a" : v.status === "idle" ? "#d97706" : "#dc2626"} fillOpacity="0.2" />
          </g>
        ))}
      </svg>
      <div style={{ position: "absolute", top: 10, right: 10, background: "white", borderRadius: 8, padding: "6px 10px", fontSize: 11, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} /> <span style={{ color: COLORS.textMuted }}>Moving</span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#d97706", display: "inline-block" }} /> <span style={{ color: COLORS.textMuted }}>Idle</span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} /> <span style={{ color: COLORS.textMuted }}>Off</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(255,255,255,0.9)", borderRadius: 6, padding: "4px 8px", fontSize: 10, color: COLORS.textMuted }}>
        Karachi Fleet Map
      </div>
    </div>
  );
}

// Custom marker icons based on engine status
const createIcon = (color) => new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0z" fill="${color}"/>
      <circle cx="12.5" cy="12.5" r="5" fill="white"/>
    </svg>
  `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const VehicleMarker = React.memo(({ vehicle, position, onMarkerReady }) => {
  const markerRef = useRef();

  useEffect(() => {
    if (markerRef.current && onMarkerReady) {
      onMarkerReady(vehicle.id, markerRef.current);
    }
  }, [vehicle.id, onMarkerReady]);

  const icon = useMemo(() => {
    let color;
    if (vehicle.engine === 'ON') color = '#16a34a'; // Green
    else if (vehicle.engine === 'IDLE') color = '#d97706'; // Yellow
    else color = '#dc2626'; // Red
    return createIcon(color);
  }, [vehicle.engine]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      <Popup>
        <div>
          <strong>{vehicle.name}</strong><br />
          Driver: {vehicle.driver}<br />
          Speed: {vehicle.speed} km/h<br />
          Engine: {vehicle.engine}<br />
          Fuel: {vehicle.fuel}%
        </div>
      </Popup>
    </Marker>
  );
});

const LiveMap = React.memo(({ vehicles, selectedVehicle }) => {
  const mapRef = useRef();
  const markersRef = useRef({});
  const prevPositionsRef = useRef({});
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleMarkerReady = useCallback((id, marker) => {
    markersRef.current[id] = marker;
    if (!prevPositionsRef.current[id]) {
      prevPositionsRef.current[id] = marker.getLatLng();
    }
  }, []);

  // Center map on selected vehicle
  useEffect(() => {
    if (mapRef.current && selectedVehicle) {
      mapRef.current.setView([selectedVehicle.lat, selectedVehicle.lng], 13);
    }
  }, [selectedVehicle]);

  // Animate marker movements
  useEffect(() => {
    vehicles.forEach(vehicle => {
      const marker = markersRef.current[vehicle.id];
      if (!marker) return;

      const currentPos = prevPositionsRef.current[vehicle.id];
      const targetPos = L.latLng(vehicle.lat, vehicle.lng);

      if (!currentPos.equals(targetPos)) {
        // Cancel previous animation if any
        if (marker._animating) return;

        const startTime = Date.now();
        const duration = 2000;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeInOut = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const lat = currentPos.lat + (targetPos.lat - currentPos.lat) * easeInOut;
          const lng = currentPos.lng + (targetPos.lng - currentPos.lng) * easeInOut;

          marker.setLatLng([lat, lng]);

          if (progress < 1) {
            marker._animating = true;
            requestAnimationFrame(animate);
          } else {
            marker._animating = false;
            prevPositionsRef.current[vehicle.id] = targetPos;
          }
        };

        requestAnimationFrame(animate);
      }
    });
  }, [vehicles]);

  const center = selectedVehicle ? [selectedVehicle.lat, selectedVehicle.lng] : [24.8607, 67.0011];

  return (
    <div style={{ height: 400, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {vehicles.map(vehicle => (
          <VehicleMarker
            key={vehicle.id}
            vehicle={vehicle}
            position={[vehicle.lat, vehicle.lng]}
            onMarkerReady={handleMarkerReady}
          />
        ))}
      </MapContainer>
      
      {/* Floating overlay card */}
      {selectedVehicle && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 8,
          padding: '12px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: 200
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
            {selectedVehicle.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              Speed: <span style={{ fontWeight: 600, color: COLORS.primary }}>{selectedVehicle.speed} km/h</span>
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              Time: <span style={{ fontWeight: 600, color: COLORS.text }}>{currentTime.toLocaleTimeString()}</span>
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              Engine: <span style={{
                fontWeight: 600,
                color: selectedVehicle.engine === 'ON' ? COLORS.success : selectedVehicle.engine === 'IDLE' ? COLORS.warning : COLORS.danger
              }}>{selectedVehicle.engine}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

function DashboardPage({ vehicles }) {
  return (
    <div>
      <style>{`
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          .dashboard-two-col {
            grid-template-columns: 1fr !important;
          }
          .table-container {
            overflow-x: auto;
          }
          .table-responsive {
            font-size: 12px;
          }
          .table-responsive td, .table-responsive th {
            padding: 8px 6px !important;
          }
        }
      `}</style>
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Vehicles" value="4" sub="2 moving now" icon="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zM13 8h4l3 5v3h-7V8z" color={COLORS.primary} />
        <StatCard label="Active Trips" value="2" sub="Today" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" color={COLORS.success} />
        <StatCard label="Alerts" value="4" sub="2 critical" icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" color={COLORS.danger} />
        <StatCard label="Distance Today" value="41.4 km" sub="All vehicles" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" color={COLORS.warning} />
      </div>

      <div className="dashboard-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text, marginBottom: 14 }}>Fleet Map</div>
          <MiniMap vehicles={vehicles} selected="V001" />
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text, marginBottom: 14 }}>Recent Alerts</div>
          {mockAlerts.slice(0, 3).map(alert => (
            <div key={alert.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
              <AlertIcon type={alert.type} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{alert.msg}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{alert.vehicle} · {alert.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px", overflow: "hidden" }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text, marginBottom: 14 }}>Vehicle Status</div>
        <div className="table-container" style={{ overflowX: "auto", marginBottom: "-18px", marginLeft: "-20px", marginRight: "-20px", paddingLeft: 20, paddingRight: 20, paddingBottom: 18 }}>
          <table className="table-responsive" style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Vehicle", "Driver", "Speed", "Fuel", "Engine", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 600, color: COLORS.text }}>{v.name}<div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 400 }}>{v.plate}</div></td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: COLORS.textMuted }}>{v.driver}</td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{v.speed} km/h</td>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${v.fuel}%`, background: v.fuel < 30 ? COLORS.danger : v.fuel < 60 ? COLORS.warning : COLORS.success, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: COLORS.textMuted, minWidth: 30 }}>{v.fuel}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: v.engine === "ON" ? COLORS.success : v.engine === "IDLE" ? COLORS.warning : COLORS.textMuted }}>{v.engine}</span>
                  </td>
                  <td style={{ padding: "12px 12px" }}><StatusBadge status={v.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function VehiclesPage({ vehicles, onAdd }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .vehicles-header {
            flex-direction: column !important;
            gap: 12px !important;
            align-items: stretch !important;
          }
          .vehicles-header input {
            width: 100% !important;
          }
          .vehicles-header button {
            width: 100% !important;
          }
          .vehicles-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 1024px) {
          .vehicles-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="vehicles-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12 }}>
        <input 
          placeholder="Search vehicles..." 
          style={{ 
            padding: "9px 14px", 
            borderRadius: 8, 
            border: `1px solid ${COLORS.border}`, 
            fontSize: 13, 
            width: 240, 
            outline: "none", 
            color: COLORS.text,
            flex: 1,
            minWidth: 200
          }} 
        />
        <button 
          onClick={() => setShowModal(true)}
          style={{ 
            background: COLORS.primary, 
            color: "white", 
            border: "none", 
            padding: "9px 18px", 
            borderRadius: 8, 
            fontSize: 13, 
            fontWeight: 600, 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            gap: 6,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}>
          + Add Vehicle
        </button>
      </div>
      <div className="vehicles-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {vehicles.map(v => (
          <div 
            key={v.id} 
            style={{ 
              background: COLORS.surface, 
              border: `1px solid ${COLORS.border}`, 
              borderRadius: 12, 
              padding: "18px 20px",
              transition: "all 0.2s ease",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.1)";
              e.currentTarget.style.borderColor = COLORS.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = COLORS.border;
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{v.name}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{v.plate}</div>
              </div>
              <StatusBadge status={v.status} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Driver", value: v.driver },
                { label: "Speed", value: `${v.speed} km/h` },
                { label: "Engine", value: v.engine },
                { label: "Fuel", value: `${v.fuel}%` },
              ].map(f => (
                <div key={f.label} style={{ background: COLORS.surfaceAlt, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button 
                style={{ 
                  flex: 1, 
                  padding: "7px", 
                  borderRadius: 7, 
                  border: `1px solid ${COLORS.border}`, 
                  background: "white", 
                  fontSize: 12, 
                  cursor: "pointer", 
                  color: COLORS.primary, 
                  fontWeight: 500,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = COLORS.primaryLight;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "white";
                }}
              >
                Track
              </button>
              <button 
                style={{ 
                  flex: 1, 
                  padding: "7px", 
                  borderRadius: 7, 
                  border: `1px solid ${COLORS.border}`, 
                  background: "white", 
                  fontSize: 12, 
                  cursor: "pointer", 
                  color: COLORS.textMuted,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = COLORS.surfaceAlt;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "white";
                }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
      {showModal && <AddVehicleModal onClose={() => setShowModal(false)} onAdd={onAdd} />}
    </div>
  );
}

function TrackingPage({ vehicles }) {
  const [selected, setSelected] = useState(vehicles[0]);
  const [liveSpeed, setLiveSpeed] = useState(selected.speed);

  useEffect(() => {
    if (selected.status !== "moving") return;
    const t = setInterval(() => setLiveSpeed(Math.floor(40 + Math.random() * 50)), 2000);
    return () => clearInterval(t);
  }, [selected]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
      <style>{`
        @media (max-width: 1024px) {
          .tracking-container {
            grid-template-columns: 1fr !important;
          }
          .vehicle-selector {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
            gap: 8px !important;
          }
          .vehicle-item {
            padding: 10px 12px !important;
          }
        }
        @media (max-width: 768px) {
          .vehicle-selector {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
          }
          .gps-stats {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textMuted, marginBottom: 10 }}>Select Vehicle</div>
        <div className="vehicle-selector" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {vehicles.map(v => (
            <div 
              key={v.id} 
              className="vehicle-item"
              onClick={() => { setSelected(v); setLiveSpeed(v.speed); }}
              style={{ 
                background: selected.id === v.id ? COLORS.primaryLight : COLORS.surface, 
                border: `1px solid ${selected.id === v.id ? COLORS.primary : COLORS.border}`, 
                borderRadius: 10, 
                padding: "12px 14px", 
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                if (selected.id !== v.id) {
                  e.currentTarget.style.borderColor = COLORS.border;
                }
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.text }}>{v.name}</div>
                <StatusBadge status={v.status} />
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{v.driver}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text, marginBottom: 14 }}>{selected.name} — Live Map</div>
          <LiveMap vehicles={vehicles} selectedVehicle={selected} />
        </div>
        <div className="gps-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Live Speed", value: `${liveSpeed} km/h`, color: COLORS.primary },
            { label: "GPS Location", value: `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`, color: COLORS.success },
            { label: "Fuel Level", value: `${selected.fuel}%`, color: selected.fuel < 30 ? COLORS.danger : COLORS.warning },
          ].map(s => (
            <div key={s.label} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, marginTop: 4, wordBreak: "break-word" }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px", marginTop: 14, overflow: "hidden" }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text, marginBottom: 14 }}>GPS Log History</div>
          <div style={{ overflowX: "auto", marginBottom: "-18px", marginLeft: "-20px", marginRight: "-20px", paddingLeft: 20, paddingRight: 20, paddingBottom: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {["Time", "Latitude", "Longitude", "Speed"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "7px 10px", fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gpsHistory.map((g, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "10px 10px", fontSize: 13, color: COLORS.textMuted }}>{g.time}</td>
                    <td style={{ padding: "10px 10px", fontSize: 13, color: COLORS.text }}>{g.lat}</td>
                    <td style={{ padding: "10px 10px", fontSize: 13, color: COLORS.text }}>{g.lng}</td>
                    <td style={{ padding: "10px 10px", fontSize: 13, fontWeight: 600, color: COLORS.primary }}>{g.speed} km/h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TripsPage() {
  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .trips-header {
            flex-direction: column !important;
            gap: 12px !important;
            align-items: stretch !important;
          }
          .trips-header > div {
            overflow-x: auto !important;
          }
          .trips-header input {
            width: 100% !important;
          }
          .trips-table {
            font-size: 12px !important;
          }
          .trips-table td, .trips-table th {
            padding: 8px 6px !important;
          }
        }
      `}</style>
      <div className="trips-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {["All", "Ongoing", "Completed"].map(f => (
            <button 
              key={f} 
              style={{ 
                padding: "7px 14px", 
                borderRadius: 7, 
                border: `1px solid ${COLORS.border}`, 
                background: f === "All" ? COLORS.primary : "white", 
                color: f === "All" ? "white" : COLORS.textMuted, 
                fontSize: 12, 
                cursor: "pointer", 
                fontWeight: f === "All" ? 600 : 400,
                transition: "all 0.2s ease",
                whiteSpace: "nowrap"
              }}>
              {f}
            </button>
          ))}
        </div>
        <input 
          type="date" 
          style={{ 
            padding: "7px 12px", 
            borderRadius: 8, 
            border: `1px solid ${COLORS.border}`, 
            fontSize: 13, 
            color: COLORS.text,
            minWidth: 150
          }} 
        />
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="trips-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ background: COLORS.surfaceAlt, borderBottom: `1px solid ${COLORS.border}` }}>
                {["Vehicle", "Driver", "From", "To", "Distance", "Duration", "Date", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockTrips.map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "13px 14px", fontSize: 13, fontWeight: 600, color: COLORS.text }}>{t.vehicle}</td>
                  <td style={{ padding: "13px 14px", fontSize: 13, color: COLORS.textMuted }}>{t.driver}</td>
                  <td style={{ padding: "13px 14px", fontSize: 13, color: COLORS.text }}>{t.start}</td>
                  <td style={{ padding: "13px 14px", fontSize: 13, color: COLORS.text }}>{t.end}</td>
                  <td style={{ padding: "13px 14px", fontSize: 13, color: COLORS.primary, fontWeight: 600 }}>{t.distance}</td>
                  <td style={{ padding: "13px 14px", fontSize: 13, color: COLORS.textMuted }}>{t.duration}</td>
                  <td style={{ padding: "13px 14px", fontSize: 12, color: COLORS.textMuted }}>{t.date}</td>
                  <td style={{ padding: "13px 14px" }}><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AlertsPage() {
  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .alerts-header {
            grid-template-columns: 1fr !important;
          }
          .alerts-list {
            flex-direction: column !important;
          }
        }
      `}</style>
      <div className="alerts-header" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: COLORS.dangerLight, border: `1px solid #fca5a5`, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", transition: "all 0.2s ease" }}>
          <AlertIcon type="danger" />
          <div><div style={{ fontWeight: 700, fontSize: 18, color: COLORS.danger }}>2</div><div style={{ fontSize: 12, color: COLORS.danger }}>Critical Alerts</div></div>
        </div>
        <div style={{ background: COLORS.warningLight, border: `1px solid #fcd34d`, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", transition: "all 0.2s ease" }}>
          <AlertIcon type="warning" />
          <div><div style={{ fontWeight: 700, fontSize: 18, color: COLORS.warning }}>2</div><div style={{ fontSize: 12, color: COLORS.warning }}>Warnings</div></div>
        </div>
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div className="alerts-list" style={{ display: "flex", flexDirection: "column" }}>
          {mockAlerts.map((alert, i) => (
            <div 
              key={alert.id} 
              style={{ 
                display: "flex", 
                gap: 16, 
                alignItems: "center", 
                padding: "16px 20px", 
                borderBottom: i < mockAlerts.length - 1 ? `1px solid ${COLORS.border}` : "none",
                transition: "background 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.surfaceAlt;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <AlertIcon type={alert.type} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 500 }}>{alert.msg}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>{alert.vehicle} · {alert.time}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: alert.type === "danger" ? COLORS.dangerLight : COLORS.warningLight, color: alert.type === "danger" ? COLORS.danger : COLORS.warning, whiteSpace: "nowrap" }}>
                {alert.type === "danger" ? "Critical" : "Warning"}
              </span>
              <button 
                style={{ 
                  padding: "6px 12px", 
                  borderRadius: 7, 
                  border: `1px solid ${COLORS.border}`, 
                  background: "white", 
                  fontSize: 12, 
                  cursor: "pointer", 
                  color: COLORS.textMuted,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = COLORS.surfaceAlt;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "white";
                }}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FleetDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [vehicles, setVehicles] = useState(mockVehicles);

  const handleAddVehicle = async (form) => {
    const newVehicle = {
      id: `V${vehicles.length + 1}`,
      name: form.model || "New Vehicle",
      plate: form.numberPlate || "UNKNOWN",
      driver: form.driverId || "Unassigned",
      status: "idle",
      speed: 0,
      fuel: 100,
      engine: "OFF",
      lat: 24.8607 + Math.random() * 0.02,
      lng: 67.0011 + Math.random() * 0.02,
    };
    setVehicles(prev => [...prev, newVehicle]);
  };

  useEffect(() => {
    const t = setInterval(() => {
      setVehicles(prev => prev.map(v => v.status === "moving" ? { ...v, speed: Math.floor(35 + Math.random() * 60), lat: v.lat + (Math.random() - 0.5) * 0.001, lng: v.lng + (Math.random() - 0.5) * 0.001 } : v));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const pageTitles = { dashboard: "Dashboard", vehicles: "Vehicles", tracking: "Live Tracking", trips: "Trip History", alerts: "Alerts" };

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      background: COLORS.bg, 
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflow: "hidden"
    }}>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-main {
            flex-direction: column !important;
          }
          .dashboard-content {
            flex: 1 !important;
            padding: 16px !important;
            margin-top: 56px !important;
          }
          .dashboard-topbar {
            padding: 0 16px !important;
            height: 56px !important;
          }
        }
      `}</style>
      <Sidebar active={activePage} setActive={setActivePage} collapsed={collapsed} />
      <div className="dashboard-main" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="dashboard-topbar" style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button 
              onClick={() => setCollapsed(c => !c)} 
              style={{ 
                background: "none", 
                border: "none", 
                cursor: "pointer", 
                padding: 4, 
                color: COLORS.textMuted,
                transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.target.style.color = COLORS.text}
              onMouseLeave={(e) => e.target.style.color = COLORS.textMuted}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: 0 }}>{pageTitles[activePage]}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.success }} />
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Live · Updated just now</span>
          </div>
        </div>
        <div className="dashboard-content" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {activePage === "dashboard" && <DashboardPage vehicles={vehicles} />}
          {activePage === "vehicles" && <VehiclesPage vehicles={vehicles} onAdd={handleAddVehicle} />}
          {activePage === "tracking" && <TrackingPage vehicles={vehicles} />}
          {activePage === "trips" && <TripsPage />}
          {activePage === "alerts" && <AlertsPage />}
        </div>
      </div>
    </div>
  );
}
