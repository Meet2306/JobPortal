const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { sendEmail } = require('../utils/emailService');
require('dotenv').config();

// Strong password policy regex
const reqPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().regex(reqPasswordRegex).required()
        .messages({ 'string.pattern.base': 'Password must be at least 8 chars, contain upper, lower, digit, and special char.' }),
    role: Joi.string().valid('student', 'company', 'admin').required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

exports.register = async (req, res) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Default verify admin automatically for demo, otherwise false
        const isVerified = role === 'admin';

        const newUser = new User({ email, password: hashedPassword, role, isVerified });
        await newUser.save();

        // Create empty profiles for roles
        if (role === 'student') {
            await new StudentProfile({ user: newUser._id, name: 'TBD', contactNumber: 'TBD', cgpa: 0, branch: 'TBD', passingYear: 2024 }).save();
            await sendEmail(email, 'Registration Successful', '<p>Welcome to Placement Portal. Please wait for admin verification after completing profile.</p>');
        } else if (role === 'company') {
            await new CompanyProfile({ user: newUser._id, companyName: 'TBD' }).save();
            await sendEmail(email, 'Company Registration Received', '<p>Your company profile is created. Please await TPO approval.</p>');
        }

        res.status(201).json({ message: 'Registration successful. Complete your profile and wait for verification.' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid email or password' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user._id, role: user.role, isVerified: user.isVerified },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set HTTP-Only Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ message: 'Logged in successfully', role: user.role, isVerified: user.isVerified });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
};

exports.me = async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
};
