const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity, size, color } = req.body;

    // Validate product existence
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock
    if (product.stock < quantity) {
        return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
    }

    // Get user's cart or create a new one
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = new Cart({
            user: req.user._id,
            cartItems: []
        });
    }

    // Check if product already exists in cart with same size and color
    const existingItemIndex = cart.cartItems.findIndex(
        item => item.product.toString() === productId && item.size === size && item.color === color
    );

    if (existingItemIndex > -1) {
        // Item exists, update quantity
        cart.cartItems[existingItemIndex].quantity += Number(quantity);
    } else {
        // Add new item
        // Snapshot price here to prevent issue if product price changes later
        cart.cartItems.push({
            product: productId,
            name: product.name,
            image: product.images && product.images.length > 0 ? product.images[0] : '',
            price: product.price,
            quantity: Number(quantity),
            size,
            color
        });
    }

    // Total calculations are handled by pre-save hook in Cart model
    await cart.save();

    // Return updated cart with populated products
    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('cartItems.product', 'name price stock images');
    res.status(200).json(updatedCart);
});

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getMyCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate('cartItems.product', 'name price stock images');

    if (!cart) {
        // Return empty cart if none exists
        return res.status(200).json({
            user: req.user._id,
            cartItems: [],
            totalItems: 0,
            totalPrice: 0
        });
    }

    res.status(200).json(cart);
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    const itemId = req.params.itemId;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.cartItems.findIndex(item => item._id.toString() === itemId);

    if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
    }

    const newQuantity = Number(quantity);

    if (newQuantity <= 0) {
        // Remove item if quantity becomes 0
        cart.cartItems.splice(itemIndex, 1);
    } else {
        // Verify stock against new quantity
        const product = await Product.findById(cart.cartItems[itemIndex].product);
        if (product && product.stock < newQuantity) {
            return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
        }
        cart.cartItems[itemIndex].quantity = newQuantity;
    }

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('cartItems.product', 'name price stock images');
    res.status(200).json(updatedCart);
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeCartItem = asyncHandler(async (req, res) => {
    const itemId = req.params.itemId;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }

    cart.cartItems = cart.cartItems.filter(item => item._id.toString() !== itemId);

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('cartItems.product', 'name price stock images');
    res.status(200).json(updatedCart);
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
        cart.cartItems = [];
        await cart.save();
        res.status(200).json({ message: 'Cart cleared successfully' });
    } else {
        res.status(404).json({ message: 'Cart not found' });
    }
});

module.exports = {
    addToCart,
    getMyCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart
};
