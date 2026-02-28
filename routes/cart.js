const express = require('express');
const router = express.Router();
const {
    addToCart,
    getMyCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// All cart routes require authentication
router.use(protect);

router.post('/', addToCart);
router.get('/', getMyCart);
router.delete('/', clearCart); // Important: Keep this before /:itemId to avoid confusion

router.put('/:itemId', updateCartItemQuantity);
router.delete('/:itemId', removeCartItem);

module.exports = router;
