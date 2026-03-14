const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const helmet = require("helmet");

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(helmet({
    crossOriginResourcePolicy: false // FIX: allow cross-origin requests
}));
// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://job-portal-wpzs.vercel.app"
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'placements-node-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 3600000, // 1 hour
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);

// DB & Server startup
const PORT = process.env.PORT || 5000;

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState;
    console.log("MongoDB connected");
};

connectDB();

module.exports = app;
