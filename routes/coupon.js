const express = require('express');
const router = express.Router();
const {
    createCoupon,
    getCoupons,
    updateCoupon,
    deleteCoupon,
    validateCoupon
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/auth');

router.post('/validate', protect, validateCoupon);

router.route('/')
    .get(protect, admin, getCoupons)
    .post(protect, admin, createCoupon);

router.route('/:id')
    .put(protect, admin, updateCoupon)
    .delete(protect, admin, deleteCoupon);

module.exports = router;
