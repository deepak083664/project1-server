const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const paymentService = require('../services/paymentService');
const sendEmail = require('../utils/sendEmail');
const { orderConfirmationTemplate } = require('../utils/emailTemplates');

/**
 * @desc    Create Razorpay order and save pending order in DB
 * @route   POST /api/payment/create-order
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
    const { shippingAddress, paymentMethod, couponCode } = req.body;

    if (!shippingAddress || !paymentMethod) {
        return res.status(400).json({ message: 'Shipping address and payment method required' });
    }

    // 1. Fetch user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }

    // 2. Calculate totals securely on backend
    let itemsPrice = 0;
    const orderItems = [];

    for (const item of cart.items) {
        if (!item.product) {
            return res.status(400).json({ message: 'A product in the cart is no longer available' });
        }

        itemsPrice += item.product.price * item.quantity;
        orderItems.push({
            name: item.product.name,
            quantity: item.quantity,
            image: item.product.images[0] || 'no-image', // Fallback, assuming images array
            price: item.product.price,
            size: item.size,
            color: item.color,
            product: item.product._id
        });
    }

    // 3. Apply coupon if valid
    let discount = 0;
    if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
        if (coupon && coupon.validUntil > Date.now()) {
            discount = (itemsPrice * coupon.discountPercentage) / 100;
        }
    }

    itemsPrice = itemsPrice - discount;

    // Fixed dummy values for tax and shipping for now
    const taxPrice = itemsPrice > 0 ? (0.18 * itemsPrice).toFixed(2) : 0; // 18% tax example
    const shippingPrice = itemsPrice > 500 ? 0 : 50; // Free shipping over 500
    const totalPrice = (Number(itemsPrice) + Number(taxPrice) + Number(shippingPrice)).toFixed(2);

    // 4. Create Order in DB (Status: Pending)
    const order = new Order({
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
    });

    const savedOrder = await order.save();

    // 5. Create Razorpay order
    try {
        const rpOrder = await paymentService.createRazorpayOrder(totalPrice, savedOrder._id);

        // Save the Razorpay Order ID to our order
        savedOrder.razorpayOrderId = rpOrder.id;
        await savedOrder.save();

        res.status(201).json({
            message: 'Order created successfully',
            orderId: savedOrder._id,
            razorpayOrderId: rpOrder.id,
            amount: rpOrder.amount,
            currency: rpOrder.currency,
        });
    } catch (error) {
        res.status(500).json({ message: 'Payment gateway error', error: error.message });
    }
});

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/payment/verify
 * @access  Private
 */
const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing payment details' });
    }

    const isValid = paymentService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    );

    if (isValid) {
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id }).populate('orderItems.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if we already processed this to avoid duplicate emails/deductions
        const isAlreadyPaid = order.paymentStatus === 'Paid';

        // Use service to handle successful payment (status updates, stock deduction)
        await paymentService.handleSuccessfulPayment(order._id, razorpay_payment_id);

        // Send Email if it wasn't already paid
        if (!isAlreadyPaid) {
            // Need the full order for the template, paymentService might return updated, 
            // but we need it populated anyway for the email. Let's fetch the fresh state:
            const updatedOrder = await Order.findById(order._id).populate('orderItems.product');

            // Note: req.user contains the buyer's details since this route is protected
            const emailHtml = orderConfirmationTemplate(req.user, updatedOrder);

            // Fire and forget email sending (we don't await/block the frontend response if SMTP is slow)
            sendEmail({
                to: req.user.email,
                subject: `Order Confirmed - #${updatedOrder._id} - Project1 Store`,
                html: emailHtml
            });
        }

        // Clear user's cart
        await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalAmount: 0 });

        res.status(200).json({ message: 'Payment verified successfully', orderId: order._id });
    } else {
        // Find order and mark failed
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        if (order) {
            order.paymentStatus = 'Failed';
            await order.save();
        }
        res.status(400).json({ message: 'Invalid payment signature' });
    }
});

/**
 * @desc    Webhook handler for Razorpay events
 * @route   POST /api/payment/webhook
 * @access  Public
 */
const webhookHandler = asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];

    // Quick validation of the webhook payload
    const isValid = paymentService.validateWebhookSignature(req.body, signature);

    if (!isValid) {
        return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    try {
        await paymentService.handleWebhookEvent(req.body);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
});

module.exports = {
    createOrder,
    verifyPayment,
    webhookHandler
};
