const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

/**
 * Creates a Razorpay order.
 * @param {number} amount In INR (rupees).
 * @param {string} receiptId Unique receipt ID (often mapped to internal DB order ID).
 * @returns {Promise<Object>} The Razorpay order object.
 */
const createRazorpayOrder = async (amount, receiptId) => {
    try {
        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency: 'INR',
            receipt: receiptId.toString(),
            payment_capture: 1 // Auto-capture payments
        };

        const razorpayOrder = await razorpay.orders.create(options);
        return razorpayOrder;
    } catch (error) {
        console.error('Error creating Razorpay Order:', error);
        throw new Error('Could not create Razorpay order');
    }
};

/**
 * Verifies the payment signature sent by Razorpay checkout client.
 * @param {string} orderId The original razorpay_order_id.
 * @param {string} paymentId The razorpay_payment_id.
 * @param {string} signature The razorpay_signature.
 * @returns {boolean} True if signature is valid.
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
    const body = orderId + '|' + paymentId;

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');

    return expectedSignature === signature;
};

/**
 * Deducts inventory for purchased items.
 * @param {Array} orderItems Array of items from the order.
 */
const deductInventory = async (orderItems) => {
    for (const item of orderItems) {
        // Find product and reduce countInStock
        const product = await Product.findById(item.product);
        if (product && product.countInStock >= item.quantity) {
            product.countInStock -= item.quantity;
            await product.save();
        } else {
            console.error(`Insufficient stock for Product ${item.name} (${item.product})`);
            // You may want to handle this edge case gracefully, 
            // maybe email the admin if a race condition happened.
        }
    }
};

/**
 * Updates order logic after successful payment verified.
 * @param {string} dbOrderId Internal DB Order ID
 * @param {string} rpPaymentId Razorpay Payment ID
 */
const handleSuccessfulPayment = async (dbOrderId, rpPaymentId) => {
    const order = await Order.findById(dbOrderId);
    if (!order) {
        throw new Error('Order not found');
    }

    if (order.paymentStatus === 'Paid') {
        // Idempotency: skip if already paid
        return order;
    }

    order.paymentStatus = 'Paid';
    order.orderStatus = 'Processing';
    order.paymentId = rpPaymentId;
    order.isPaid = true;
    order.paidAt = Date.now();

    const updatedOrder = await order.save();

    // Deduct stock
    await deductInventory(order.orderItems);

    return updatedOrder;
};

/**
 * Validates a webhook event payload signature.
 */
const validateWebhookSignature = (body, signature) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        console.warn('RAZORPAY_WEBHOOK_SECRET not set, checking standard secret instead');
    }
    const usedSecret = secret || process.env.RAZORPAY_KEY_SECRET;

    const expectedSignature = crypto
        .createHmac('sha256', usedSecret)
        .update(JSON.stringify(body))
        .digest('hex');

    return expectedSignature === signature;
};

/**
 * Processes incoming Razorpay webhook.
 */
const handleWebhookEvent = async (eventBody) => {
    const event = eventBody.event;
    const paymentEntity = eventBody.payload.payment.entity;

    // The notes section is a great place to attach your internal order ID during order creation.
    // If not, we map using the Razorpay Order ID.
    const razorpayOrderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    if (!razorpayOrderId) return;

    const dbOrder = await Order.findOne({ razorpayOrderId });
    if (!dbOrder) {
        console.error('Webhook: DB Order not found for RP Order:', razorpayOrderId);
        return;
    }

    switch (event) {
        case 'payment.captured':
            console.log(`Webhook: Payment captured for ${dbOrder._id}`);
            await handleSuccessfulPayment(dbOrder._id, paymentId);
            break;

        case 'payment.failed':
            console.log(`Webhook: Payment failed for ${dbOrder._id}`);
            dbOrder.paymentStatus = 'Failed';
            await dbOrder.save();
            break;

        default:
            console.log('Webhook: Unhandled event', event);
    }
};

module.exports = {
    createRazorpayOrder,
    verifyPaymentSignature,
    handleSuccessfulPayment,
    validateWebhookSignature,
    handleWebhookEvent
};
