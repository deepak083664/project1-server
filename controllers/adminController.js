const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Get total users
    const totalUsers = await User.countDocuments();

    // 2. Get total orders
    const totalOrders = await Order.countDocuments();

    // 3. Get total revenue
    // Aggregate all paid orders (or all orders depending on business logic - let's say all orders that are not Cancelled)
    const revenueAggregation = await Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalSales : 0;

    // 4. Get total products
    const totalProducts = await Product.countDocuments();

    // 5. Get recent orders (last 5)
    const recentOrders = await Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5);

    // 6. Get monthly sales chart data
    const last12Months = new Date();
    last12Months.setMonth(last12Months.getMonth() - 11);

    const monthlySales = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: last12Months },
                orderStatus: { $ne: 'Cancelled' }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                totalSales: { $sum: '$totalPrice' },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.json({
        totalUsers,
        totalOrders,
        totalRevenue,
        totalProducts,
        recentOrders,
        monthlySales
    });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === 'admin') {
            res.status(400);
            throw new Error('Cannot delete admin user');
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.role = req.body.role || user.role;
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isBlocked: updatedUser.isBlocked
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Toggle user block status
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
const toggleUserBlock = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === 'admin') {
            res.status(400);
            throw new Error('Cannot block admin user');
        }
        user.isBlocked = !user.isBlocked;
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isBlocked: updatedUser.isBlocked
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    getDashboardStats,
    getUsers,
    deleteUser,
    updateUserRole,
    toggleUserBlock
};
