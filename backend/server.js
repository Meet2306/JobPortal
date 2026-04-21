const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();
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
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

let sessionOptions = {
    secret: process.env.SESSION_SECRET || 'placements-node-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // removed production condition
        httpOnly: true,
        maxAge: 3600000, // 1 hour
        sameSite: 'lax' // lax for local
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

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to connect to MongoDB", err);
});

module.exports = app;
