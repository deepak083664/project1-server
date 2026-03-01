const express = require('express');
const router = express.Router();
const { addToWishlist, removeFromWishlist, getWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(protect);

router.post('/add', addToWishlist);
router.post('/remove', removeFromWishlist);
router.get('/', getWishlist);

module.exports = router;
