const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');
const {
    createOrder,
    verifyPayment,
    webhookHandler
} = require('../controllers/paymentController');

// Rate limiter for payment creation to prevent spam
const paymentCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 create-order requests per `window`
    message: { message: 'Too many payment requests from this IP, please try again after 15 minutes.' }
});

router.post('/create-order', protect, paymentCreationLimiter, createOrder);
router.post('/verify', protect, verifyPayment);

// Webhook requires raw or specifically parsed JSON, we'll keep it standard if parser handles it.
router.post('/webhook', webhookHandler);

module.exports = router;
