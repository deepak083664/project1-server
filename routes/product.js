const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProductById,
    getProductById,
    updateProduct,
    deleteProduct,
    createProductReview,
    deleteReview
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware'); // Updated to use authMiddleware if that exists. Let's make sure.

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin restricted routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

// Review routes
router.post('/:id/reviews', protect, createProductReview);
router.delete('/:id/reviews/:reviewId', protect, admin, deleteReview);

module.exports = router;
