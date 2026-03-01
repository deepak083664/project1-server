const User = require('../models/User');
const Product = require('../models/Product');

// Add a product to the user's wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const user = await User.findById(req.user._id);

        // Check if already in wishlist
        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ success: false, message: 'Product already in wishlist' });
        }

        user.wishlist.push(productId);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Product added to wishlist',
            wishlist: user.wishlist
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Remove a product from the user's wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        const user = await User.findById(req.user._id);

        // Filter out the product ID
        user.wishlist = user.wishlist.filter(
            (id) => id.toString() !== productId.toString()
        );
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Product removed from wishlist',
            wishlist: user.wishlist
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get the user's wishlist
exports.getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist', 'name price images rating numReviews category');

        res.status(200).json({
            success: true,
            count: user.wishlist.length,
            wishlist: user.wishlist
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
