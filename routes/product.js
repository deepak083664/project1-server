const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    createProductReview,
    deleteReview,
    getRecommendedProducts,
    getPopularProducts
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth'); // Updated to use authMiddleware if that exists. Let's make sure.

// Public routes
router.get('/popular/top', getPopularProducts); // Avoid matching /:id route
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/recommendations', getRecommendedProducts);

// Admin restricted routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

// Review routes
router.post('/:id/reviews', protect, createProductReview);
router.delete('/:id/reviews/:reviewId', protect, admin, deleteReview);

module.exports = router;
