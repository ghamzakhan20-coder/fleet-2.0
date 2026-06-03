import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getUsersWithVehicles, getGPSLogs, getEngineLogs, registerUser } from '../api/services';

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

function StatusBadge({ status }) {
  const m = {
    active: ["#dcfce7", "#15803d", "Active"],
    inactive: ["#fee2e2", "#b91c1c", "Inactive"],
    driver: ["#dbeafe", "#1d4ed8", "Driver"],
    owner: ["#fef9c3", "#a16207", "Owner"],
    admin: ["#e0e7ff", "#4f46e5", "Admin"],
  };
  const [bg, color, label] = m[status] || ["#f0f4f8", "#64748b", "Unknown"];
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

function VehicleDetailsModal({ vehicle, onClose }) {
  const [gpsLogs, setGpsLogs] = useState([]);
  const [engineLogs, setEngineLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vehicle) return;
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError('');
        const [gpsRes, engineRes] = await Promise.all([
          getGPSLogs(vehicle._id, 1, 20),
          getEngineLogs(vehicle._id, 1, 20),
        ]);
        setGpsLogs(gpsRes.data.data?.logs || []);
        setEngineLogs(engineRes.data.data?.logs || []);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Failed to load vehicle logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [vehicle]);

  if (!vehicle) return null;

  const latestGPS = gpsLogs[0];
  const mapCenter = latestGPS 
    ? [latestGPS.latitude, latestGPS.longitude] 
    : [24.8607, 67.0011]; // Default to Karachi

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: C.surface,
        borderRadius: 12,
        padding: 24,
        width: '90%',
        maxWidth: 800,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Vehicle Details</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: C.textMuted }}>×</button>
        </div>

        {error && <div style={{ background: C.dangerLight, border: `1px solid #fca5a5`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: C.danger, marginBottom: 16 }}>{error}</div>}

        {/* Vehicle Info */}
        <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: 'monospace' }}>{vehicle.deviceId}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Status</div>
              <StatusBadge status={vehicle.isActive ? 'active' : 'inactive'} />
            </div>
          </div>
        </div>

        {/* Owner & Driver Info */}
        {(vehicle.owner || vehicle.driver) && (
          <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {vehicle.owner && (
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Owner</div>
                <div style={{ fontSize: 13, color: C.text }}>{vehicle.owner.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{vehicle.owner.email}</div>
              </div>
            )}
            {vehicle.driver && (
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Assigned Driver</div>
                <div style={{ fontSize: 13, color: C.text }}>{vehicle.driver.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{vehicle.driver.email}</div>
              </div>
            )}
          </div>
        )}

        {/* Live Map */}
        {loading ? (
          <Loader />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Live Location</div>
              <div style={{ height: 280, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {latestGPS && (
                    <Marker position={[latestGPS.latitude, latestGPS.longitude]} icon={vehicleIcon}>
                      <Popup>
                        <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                          <strong>Current Position</strong><br />
                          {latestGPS.latitude.toFixed(5)}, {latestGPS.longitude.toFixed(5)}<br />
                          Speed: {latestGPS.speed} km/h<br />
                          {new Date(latestGPS.timestamp).toLocaleTimeString()}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>

            {/* GPS Logs */}
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Recent GPS Logs</div>
              {gpsLogs.length === 0 ? (
                <div style={{ fontSize: 12, color: C.textMuted, padding: '12px 0' }}>No GPS data available</div>
              ) : (
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: C.textMuted }}>Time</th>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: C.textMuted }}>Latitude</th>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: C.textMuted }}>Longitude</th>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: C.textMuted }}>Speed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gpsLogs.slice(0, 8).map((log, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '6px 0', color: C.text }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td style={{ padding: '6px 0', color: C.text }}>{log.latitude.toFixed(5)}</td>
                        <td style={{ padding: '6px 0', color: C.text }}>{log.longitude.toFixed(5)}</td>
                        <td style={{ padding: '6px 0', color: C.text, fontWeight: 600 }}>{log.speed} km/h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Engine Logs */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Recent Engine Logs</div>
              {engineLogs.length === 0 ? (
                <div style={{ fontSize: 12, color: C.textMuted, padding: '12px 0' }}>No engine data available</div>
              ) : (
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: C.textMuted }}>Time</th>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: C.textMuted }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: C.textMuted }}>RPM</th>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: C.textMuted }}>Temp</th>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: C.textMuted }}>Fuel</th>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: C.textMuted }}>Battery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engineLogs.slice(0, 8).map((log, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '6px 0', color: C.text }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td style={{ padding: '6px 0' }}><StatusBadge status={log.engineStatus} /></td>
                        <td style={{ padding: '6px 0', color: C.text }}>{log.rpm}</td>
                        <td style={{ padding: '6px 0', color: log.engineTemp > 100 ? C.danger : C.text }}>{log.engineTemp.toFixed(1)}°</td>
                        <td style={{ padding: '6px 0', color: log.fuelLevel < 30 ? C.danger : C.text }}>{log.fuelLevel.toFixed(0)}%</td>
                        <td style={{ padding: '6px 0', color: C.text }}>{log.batteryVoltage.toFixed(1)}V</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{
            flex: 1,
            padding: '10px 16px',
            background: C.primary,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


function AdminUserVehicles({ user, onBack }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const allVehicles = [
    ...(user.vehiclesOwned || []),
    ...(user.vehiclesAssigned || []).filter(v => !user.vehiclesOwned.some(ov => ov._id === v._id)),
  ];

  return (
    <div>
      <button onClick={onBack} style={{
        marginBottom: 16,
        padding: '8px 14px',
        background: 'none',
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        fontSize: 12,
        cursor: 'pointer',
        color: C.primary,
      }}>
        ← Back to Users
      </button>

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Vehicles for {user.name}</h2>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{allVehicles.length} vehicle(s)</div>
      </div>

      {allVehicles.length === 0 ? (
        <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
          No vehicles found for this user.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {allVehicles.map(vehicle => (
            <div key={vehicle._id} onClick={() => setSelectedVehicle(vehicle)} style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 16,
              cursor: 'pointer',
              transition: 'all 0.2s',
              hover: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.target.style.boxShadow = 'none'}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 8 }}>{vehicle.model}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Registration</div>
                  <div style={{ fontSize: 12, color: C.text }}>{vehicle.numberPlate}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Device ID</div>
                  <div style={{ fontSize: 12, color: C.text, fontFamily: 'monospace' }}>{vehicle.deviceId}</div>
                </div>
                <div style={{ marginTop: 4 }}>
                  <StatusBadge status={vehicle.isActive ? 'active' : 'inactive'} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedVehicle && <VehicleDetailsModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />}
    </div>
  );
}

export default function AdminDashboard() {
  const [view, setView] = useState('users'); // 'users' or 'vehicles'
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'email' or 'date'
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', password: '' });
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    if (!ownerForm.name.trim() || !ownerForm.email.trim() || !ownerForm.password.trim()) {
      setRegisterError('All fields are required.');
      return;
    }
    if (!validateEmail(ownerForm.email.trim())) {
      setRegisterError('Please enter a valid email address.');
      return;
    }

    try {
      setRegisterLoading(true);
      await registerUser({
        name: ownerForm.name.trim(),
        email: ownerForm.email.trim(),
        password: ownerForm.password,
        role: 'owner',
      });
      setRegisterSuccess('Owner registered successfully.');
      setOwnerForm({ name: '', email: '', password: '' });
      await fetchUsers();
      setTimeout(() => setShowRegisterModal(false), 500);
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setRegisterLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getUsersWithVehicles();
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'email') return a.email.localeCompare(b.email);
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  if (view === 'vehicles' && selectedUser) {
    return <AdminUserVehicles user={selectedUser} onBack={() => { setView('users'); setSelectedUser(null); }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Admin Dashboard</h1>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Manage registered users and their vehicles</div>
        </div>
        <button onClick={() => { setShowRegisterModal(true); setRegisterError(''); setRegisterSuccess(''); }} style={{
          padding: '12px 18px',
          background: C.primary,
          color: 'white',
          border: 'none',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          minWidth: 180,
        }}>
          Register New Owner
        </button>
      </div>

      {error && <ErrorBox msg={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 14px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
            background: C.surface,
          }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '10px 14px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
            background: C.surface,
          }}
        >
          <option value="name">Sort by Name</option>
          <option value="email">Sort by Email</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : filteredUsers.length === 0 ? (
        <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
          {searchTerm ? 'No users found matching your search.' : 'No registered users found.'}
        </div>
      ) : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textMuted }}>Full Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textMuted }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textMuted }}>Role</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textMuted }}>Registration Date</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textMuted }}>Vehicles</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id} onClick={() => { setSelectedUser(user); setView('vehicles'); }} style={{
                  borderBottom: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.background = C.primaryLight}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.text, fontWeight: 500 }}>{user.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.textMuted }}>{user.email}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={user.role} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.textMuted }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.primary }}>
                    {(user.vehiclesOwned?.length || 0) + (user.vehiclesAssigned?.length || 0)} vehicle(s)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showRegisterModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 24,
        }}>
          <div style={{
            width: '100%',
            maxWidth: 520,
            background: C.surface,
            borderRadius: 14,
            padding: 24,
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Register New Owner</h2>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Create a new owner account with role owner.</div>
              </div>
              <button onClick={() => setShowRegisterModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, lineHeight: 1, cursor: 'pointer', color: C.textMuted }}>×</button>
            </div>

            {registerError && <ErrorBox msg={registerError} />}
            {registerSuccess && (
              <div style={{ background: C.successLight, border: `1px solid ${C.success}`, borderRadius: 10, padding: '12px 16px', color: C.success, fontSize: 13, marginBottom: 16 }}>
                {registerSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit}>
              <div style={{ display: 'grid', gap: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Full Name</label>
                <input
                  value={ownerForm.name}
                  onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                  placeholder="Owner full name"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, outline: 'none', background: C.surfaceAlt }}
                />
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Email</label>
                <input
                  type="email"
                  value={ownerForm.email}
                  onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                  placeholder="owner@example.com"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, outline: 'none', background: C.surfaceAlt }}
                />
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Password</label>
                <input
                  type="password"
                  value={ownerForm.password}
                  onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                  placeholder="Enter password"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, outline: 'none', background: C.surfaceAlt }}
                />
                <button type="submit" disabled={registerLoading} style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '12px 16px',
                  background: registerLoading ? C.primaryLight : C.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: registerLoading ? 'not-allowed' : 'pointer',
                }}>
                  {registerLoading ? 'Registering...' : 'Register Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
