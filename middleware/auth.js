const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Check if Authorization header exists and starts with Bearer
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token using JWT_SECRET
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token - exclude password
            // Attach decoded user to req.user
            req.user = await User.findById(decoded.id).select('-password');

            return next(); // Move to the next middleware or route handler
        } catch (error) {
            console.error(error);
            // Return 401 if token is invalid
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // Return 401 if token is missing
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
