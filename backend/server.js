const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const helmet = require("helmet");
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const atsRoutes = require('./routes/atsRoutes');

const app = express();

// Ensure uploads/ directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));
app.use(helmet({
    crossOriginResourcePolicy: false // FIX: allow cross-origin requests
}));
// Middleware
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://job-portal-wpzs.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(o => origin.startsWith(o))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
}
if (!process.env.SESSION_SECRET) {
    throw new Error('Missing SESSION_SECRET environment variable');
}

let sessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction, // must be true for cross-origin in production
        httpOnly: true,
        maxAge: 3600000, // 1 hour
        sameSite: isProduction ? 'none' : 'lax' // none required for cross-origin cookies
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 3600 // 1 hour
    })
};

app.use(session(sessionOptions));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ats', atsRoutes);

// DB & Server startup
const PORT = process.env.PORT || 5000;

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState;
    console.log("MongoDB connected");
};

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

if (require.main === module) {
    startServer().catch(err => {
        console.error("Failed to connect to MongoDB", err);
    });
}

module.exports = app;