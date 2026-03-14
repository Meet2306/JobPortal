const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');
const svgCaptcha = require('svg-captcha');
require('dotenv').config();

const reqPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().regex(reqPasswordRegex).required()
        .messages({ 'string.pattern.base': 'Password must be at least 8 chars, contain upper, lower, digit, and special char.' }),
    role: Joi.string().valid('student', 'company', 'admin').required(),
    name: Joi.string().allow('').when('role', { is: 'student', then: Joi.required(), otherwise: Joi.optional() }),
    contactNumber: Joi.string().allow('').when('role', { is: 'student', then: Joi.required(), otherwise: Joi.optional() }),
    companyName: Joi.string().allow('').when('role', { is: 'company', then: Joi.required(), otherwise: Joi.optional() }),
    industry: Joi.string().allow('').optional(),
    websiteUrl: Joi.string().uri().allow('', null).optional(),
    hrContactName: Joi.string().allow('').optional(),
    hrContactEmail: Joi.string().email().allow('', null).optional(),
    hrContactNumber: Joi.string().allow('').optional(),
    description: Joi.string().allow('').optional(),
    captcha: Joi.string().required()
}).unknown(true);

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

exports.getCaptcha = (req, res) => {
    try {
        const captcha = svgCaptcha.create({
            size: 6,
            noise: 3,
            color: true,
            background: '#f0f2fa'
        });
        req.session.captcha = captcha.text.toLowerCase();
        console.log('Captcha generated:', req.session.captcha);
        res.type('svg');
        res.status(200).send(captcha.data);
    } catch (err) {
        console.error('Captcha generation error:', err);
        res.status(500).json({ error: 'Failed to generate captcha' });
    }
};

exports.register = async (req, res) => {
    try {
        console.log('Incoming Registration Request:', req.body);
        
        // 1. Verify Captcha
        if (!req.body.captcha || req.body.captcha.toLowerCase() !== req.session.captcha) {
            return res.status(400).json({ error: 'Invalid captcha code' });
        }
        
        // Clear captcha session after verification
        req.session.captcha = null;

        const { error } = registerSchema.validate(req.body);
        if (error) {
            console.log('Validation Error:', error.details[0].message);
            return res.status(400).json({ error: error.details[0].message });
        }

        const { 
            email, password, role, 
            name, contactNumber,
            companyName, industry, websiteUrl, hrContactName, hrContactEmail, hrContactNumber, description
        } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Default verify admin automatically for demo, otherwise false
        const isVerified = role === 'admin';
        const emailVerified = role === 'admin'; // Admin is pre-verified usually, or we can force it too.

        const newUser = new User({ 
            email, 
            password: hashedPassword, 
            role, 
            isVerified,
            emailVerified: emailVerified,
            emailVerificationToken: verificationToken
        });
        await newUser.save();

        const verifyUrl = `http://localhost:5173/verify-email/${verificationToken}`;

        // Create profiles with provided data
        if (role === 'student') {
            await new StudentProfile({ 
                user: newUser._id, 
                name, 
                contactNumber,
                emailAddress: email
            }).save();
            await sendEmail(email, 'Verify Your Email - Placement Portal', `
                <h3>Welcome ${name}!</h3>
                <p>Thank you for registering. Please verify your email by clicking the button below:</p>
                <a href="${verifyUrl}" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
                <p>If the button doesn't work, copy and paste this link: ${verifyUrl}</p>
            `);
        } else if (role === 'company') {
            await new CompanyProfile({ 
                user: newUser._id, 
                companyName,
                industry,
                websiteUrl,
                hrContactName,
                hrContactEmail,
                hrContactNumber,
                description
            }).save();
            await sendEmail(email, 'Verify Your Email - Placement Portal', `
                <h3>Welcome ${companyName}!</h3>
                <p>Thank you for registering. Please verify your email by clicking the button below:</p>
                <a href="${verifyUrl}" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
                <p>If the button doesn't work, copy and paste this link: ${verifyUrl}</p>
            `);
        }

        res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });
    } catch (err) {
        console.error('Registration Error:', err);
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

        if (!user.emailVerified) {
            return res.status(403).json({ error: 'Please verify your email before logging in. Check your inbox for the verification link.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, isVerified: user.isVerified },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set HTTP-Only Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
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

exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `http://localhost:5173/reset-password/${token}`;
        await sendEmail(user.email, 'Password Reset Request', `
            <h3>Placement Portal Password Reset</h3>
            <p>You requested a password reset. Please click the link below to set a new password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>If you did not request this, please ignore this email.</p>
        `);

        res.json({ message: 'Reset link sent to your email' });
    } catch (err) {
        res.status(500).json({ error: 'Server error in forgot password' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        await sendEmail(user.email, 'Password Changed Successfully', `
            <p>Your Placement Portal account password has been updated successfully.</p>
        `);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error resetting password' });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ emailVerificationToken: token });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully! You can now log in.' });
    } catch (err) {
        res.status(500).json({ error: 'Error verifying email' });
    }
};
