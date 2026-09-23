const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const specialDateRoutes = require('./routes/specialDates');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
  res.json({
    app: 'Love Bites Backend API',
    status: 'online',
    db: mongoose.connection.readyState === 1 ? 'connected (MongoDB Atlas)' : 'connecting/disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/special-dates', specialDateRoutes);

// Connect to MongoDB Atlas
async function startServer() {
  if (MONGODB_URI && !MONGODB_URI.includes('<db_username>')) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB Atlas Database');
    } catch (err) {
      console.error('❌ MongoDB Atlas connection error:', err.message);
      console.log('⚠️ Running backend API server with fallback in-memory handler...');
    }
  } else {
    console.log('ℹ️ MONGODB_URI contains <db_username> placeholder.');
    console.log('Please replace <db_username> in server/.env with your actual database user name.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Love Bites Backend Server running on http://localhost:${PORT}`);
    console.log(`📱 Ready for React Native mobile client requests`);
  });
}

startServer();
