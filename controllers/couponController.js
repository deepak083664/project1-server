const Coupon = require('../models/Coupon');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
    const { code, discountType, discountValue, expiryDate, minOrderAmount, isActive } = req.body;

    const couponExists = await Coupon.findOne({ code });

    if (couponExists) {
        res.status(400);
        throw new Error('Coupon code already exists');
    }

    const coupon = await Coupon.create({
        code,
        discountType,
        discountValue,
        expiryDate,
        minOrderAmount,
        isActive
    });

    res.status(201).json(coupon);
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = asyncHandler(async (req, res) => {
    const coupons = await Coupon.find({});
    res.json(coupons);
});

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (coupon) {
        coupon.code = req.body.code || coupon.code;
        coupon.discountType = req.body.discountType || coupon.discountType;
        coupon.discountValue = req.body.discountValue !== undefined ? req.body.discountValue : coupon.discountValue;
        coupon.expiryDate = req.body.expiryDate || coupon.expiryDate;
        coupon.minOrderAmount = req.body.minOrderAmount !== undefined ? req.body.minOrderAmount : coupon.minOrderAmount;
        coupon.isActive = req.body.isActive !== undefined ? req.body.isActive : coupon.isActive;

        const updatedCoupon = await coupon.save();
        res.json(updatedCoupon);
    } else {
        res.status(404);
        throw new Error('Coupon not found');
    }
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (coupon) {
        res.json({ message: 'Coupon removed' });
    } else {
        res.status(404);
        throw new Error('Coupon not found');
    }
});

module.exports = {
    createCoupon,
    getCoupons,
    updateCoupon,
    deleteCoupon
};
