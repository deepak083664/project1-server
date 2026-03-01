const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../config/rateLimiter');
const { validate, registerSchema, loginSchema } = require('../middleware/validator');

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback', { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                _id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get tokens
// @access  Public
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = generateTokens(user.id);

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            token: accessToken, // Sending short-lived token to client
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/refresh
// @desc    Refresh the access token
// @access  Public
router.post('/refresh', async (req, res) => {
    let refreshToken = req.cookies.jwt;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Not authorized, no refresh token' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'fallback');
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        const { accessToken } = generateTokens(user.id);

        res.json({ token: accessToken });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user / clear cookie
// @access  Private
router.post('/logout', (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/profile
// @desc    Get user profile (Example protected route)
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        // req.user is set in the auth middleware
        res.json(req.user);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/protected
// @desc    A simple protected route
// @access  Private
router.get('/protected', protect, (req, res) => {
    res.status(200).json({
        message: "Protected route accessed successfully",
        user: req.user
    });
});

module.exports = router;
