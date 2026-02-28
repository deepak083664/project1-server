const Product = require('../models/Product');

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating product' });
    }
};

// @desc    Get all products (with pagination, search, filter, sort)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;

        // Base Query
        let query = {};

        // Search by name
        if (req.query.search) {
            query.name = {
                $regex: req.query.search,
                $options: 'i',
            };
        }

        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Sorting
        let sortBy = req.query.sort === 'asc' ? { price: 1 } : req.query.sort === 'desc' ? { price: -1 } : { createdAt: -1 };

        const count = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sortBy)
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({
            products,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching products' });
    }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching product' });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            Object.assign(product, req.body);
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while updating product' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (product) {
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while deleting product' });
    }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (product) {
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'Product already reviewed' });
            }

            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id
            };

            product.reviews.push(review);

            product.numReviews = product.reviews.length;

            const totalRatings = product.reviews.reduce((acc, item) => item.rating + acc, 0);
            product.averageRating = totalRatings / product.reviews.length;
            product.ratings = product.averageRating; // keep old field synced

            await product.save();
            res.status(201).json({ message: 'Review added' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating review' });
    }
};

// @desc    Delete a review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private/Admin
const deleteReview = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            const reviews = product.reviews.filter(
                (r) => r._id.toString() !== req.params.reviewId.toString()
            );

            if (reviews.length === product.reviews.length) {
                return res.status(404).json({ message: 'Review not found' });
            }

            product.reviews = reviews;
            product.numReviews = product.reviews.length;

            if (product.numReviews > 0) {
                const totalRatings = product.reviews.reduce((acc, item) => item.rating + acc, 0);
                product.averageRating = totalRatings / product.reviews.length;
            } else {
                product.averageRating = 0;
            }
            product.ratings = product.averageRating;

            await product.save();
            res.status(200).json({ message: 'Review deleted' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while deleting review' });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    createProductReview,
    deleteReview
};
