const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch latest user data from DB to ensure verification status is current
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ error: 'User no longer exists.' });

        // Add id property for compatibility with controllers using req.user.id
        req.user = user;
        req.user.id = user._id; 
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token.' });
    }
};

module.exports = authMiddleware;
