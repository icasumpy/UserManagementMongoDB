const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');
const { allowedOrigins } = require('./config/env');

const app = express();

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '15mb' }));
app.use('/api/health', healthRoutes);
app.use('/api/auth', adminAuthRoutes);
app.use('/api/users', userRoutes);
app.use(errorHandler);

module.exports = app;
