const express = require('express');
const router = express.Router();
const {
    getAllOrders,
    updateOrderStatus,
    updateOrderPaymentStatus,
    downloadInvoice
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Note: /myorders MUST come before /:id so Express doesn't treat 'myorders' as an ID
// Specific actions
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/payment', protect, admin, updateOrderPaymentStatus);
router.get('/:id/invoice', protect, downloadInvoice);

module.exports = router;
