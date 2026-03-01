const express = require('express');
const router = express.Router();
const {
    getOrders,
    updateOrderStatus,
    updateOrderToPaid,
    downloadInvoice
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

// Note: /myorders MUST come before /:id so Express doesn't treat 'myorders' as an ID
// Specific actions
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/payment', protect, admin, updateOrderToPaid);
router.get('/:id/invoice', protect, downloadInvoice);

module.exports = router;
