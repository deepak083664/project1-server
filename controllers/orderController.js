const Order = require('../models/Order');
const Cart = require('../models/Cart');
const asyncHandler = require('../middleware/asyncHandler');
const Product = require('../models/Product'); // Added Product import
const invoiceService = require('../services/invoiceService'); // Added invoiceService import

// @desc    Create new order from user's cart
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        shippingAddress,
        paymentMethod,
        taxPrice,
        shippingPrice
    } = req.body;

    // 1. Fetch user's cart
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || cart.cartItems.length === 0) {
        return res.status(400).json({ message: 'No items in cart' });
    }

    // 2. Calculate itemsPrice directly from cart's securely stored prices
    // This prevents front-end manipulation of prices
    const itemsPrice = cart.cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );

    // Calculate total price (items + tax + shipping)
    const calculatedTaxPrice = Number(taxPrice) || 0;
    const calculatedShippingPrice = Number(shippingPrice) || 0;
    const totalPrice = itemsPrice + calculatedTaxPrice + calculatedShippingPrice;

    // 3. Create order
    const order = new Order({
        user: req.user._id,
        orderItems: cart.cartItems, // Copies the validated items snapshot
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice: calculatedTaxPrice,
        shippingPrice: calculatedShippingPrice,
        totalPrice
    });

    const createdOrder = await order.save();

    // 4. Clear the user's cart
    cart.cartItems = [];
    await cart.save();

    res.status(201).json(createdOrder);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    // Populate user name and email for admin/order display purposes
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
        // Optional security: Ensure user owns this order, unless they are an admin
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to view this order' });
        }
        res.status(200).json(order);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
    res.status(200).json(orders);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.orderStatus = req.body.orderStatus || order.orderStatus;

        // Handle delivery status update dynamically based on general orderStatus
        if (req.body.orderStatus === 'Delivered' && !order.isDelivered) {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }

        const updatedOrder = await order.save();

        // Emit socket event for real-time tracking
        try {
            const io = require('../config/socket').getIO();
            io.to(req.params.id).emit('orderStatusUpdated', updatedOrder);
        } catch (err) {
            console.error('Socket error on order update:', err);
        }

        res.status(200).json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

// @desc    Update order to paid (Mock/Optional extension)
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        // Payment result would typically go here (from Stripe/PayPal)

        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' }); // Changed status to 404 and message
    }
});

/**
 * @desc    Download invoice PDF
 * @route   GET /api/orders/:id/invoice
 * @access  Private (Owner only)
 */
const downloadInvoice = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate('user', 'name email');

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // Security Check: Ensure the user requesting the invoice owns the order
    // (You can also allow 'admin' role if wanted, using req.user.role === 'admin')
    if (order.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to access this invoice' });
    }

    try {
        const invoiceName = `invoice-${orderId}.pdf`;

        // Ensure proper headers for the stream
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${invoiceName}"`);

        // Serve the dynamically generated PDF using pdfkit stream magic
        invoiceService.buildInvoice(
            req.user,
            order,
            (chunk) => res.write(chunk), // Data callback pushes stream chunks directly to 'res'
            () => res.end() // End callback closes response properly
        );

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ message: 'Failed to generate invoice' });
    }
});

module.exports = {
    addOrderItems,
    getMyOrders,
    getOrderById,
    getOrders,
    updateOrderStatus,
    updateOrderToPaid,
    downloadInvoice // Added downloadInvoice to exports
};
