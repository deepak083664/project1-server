const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity can not be less then 1.']
    },
    size: {
        type: String
    },
    color: {
        type: String
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One cart per user
    },
    cartItems: [cartItemSchema],
    totalItems: {
        type: Number,
        required: true,
        default: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

// Pre-save middleware to automatically calculate totalItems and totalPrice
cartSchema.pre('save', function (next) {
    if (this.cartItems && this.cartItems.length > 0) {
        this.totalItems = this.cartItems.reduce((acc, item) => acc + item.quantity, 0);
        this.totalPrice = this.cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    } else {
        this.totalItems = 0;
        this.totalPrice = 0;
    }
    next();
});

module.exports = mongoose.model('Cart', cartSchema);
