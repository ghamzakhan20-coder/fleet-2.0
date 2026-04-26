require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const logRoutes = require('./routes/logRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// Enable CORS for the frontend running on localhost:3001
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Body parser
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/logs', logRoutes);

// ESP32 data endpoint (also mounted at root level for convenience)
app.use('/api', logRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚗 Smart ELD Fleet Management API is running.',
    version: '1.0.0',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
