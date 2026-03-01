const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get dashboard analytics text numbers and charts
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = asyncHandler(async (req, res) => {
    // 1. Total Metrics
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // 2. Revenue calculation
    const orders = await Order.find({});
    const totalRevenue = orders.reduce((acc, order) => {
        return order.isPaid ? acc + order.totalPrice : acc;
    }, 0);

    // 3. Sales over time (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesData = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: sevenDaysAgo },
                isPaid: true
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalSales: { $sum: "$totalPrice" },
                ordersCount: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    // 4. Products performance (Top 5 Best Sellers)
    const topProducts = await Order.aggregate([
        { $unwind: "$orderItems" },
        {
            $group: {
                _id: "$orderItems.product",
                name: { $first: "$orderItems.name" },
                quantitySold: { $sum: "$orderItems.quantity" },
                revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            }
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 5 }
    ]);

    // 5. Popular Categories
    const categoryDistribution = await Product.aggregate([
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);

    res.json({
        metrics: {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue
        },
        salesData,
        topProducts,
        categoryDistribution
    });
});

module.exports = {
    getAnalytics
};
