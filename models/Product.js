const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    discountPrice: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    sizes: [{
        type: String,
        enum: ['S', 'M', 'L', 'XL']
    }],
    colors: [{
        type: String
    }],
    images: [{
        type: String
    }],
    ratings: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    reviews: [reviewSchema],
    isFeatured: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes for recommendation and sorting optimization
productSchema.index({ category: 1, averageRating: -1 });
productSchema.index({ category: 1, numReviews: -1 });

module.exports = mongoose.model('Product', productSchema);
