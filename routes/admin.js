const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getUsers,
    deleteUser,
    updateUserRole,
    toggleUserBlock
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.route('/dashboard').get(protect, admin, getDashboardStats);

router.route('/users')
    .get(protect, admin, getUsers);

router.route('/users/:id')
    .delete(protect, admin, deleteUser);

router.route('/users/:id/role')
    .put(protect, admin, updateUserRole);

router.route('/users/:id/block')
    .put(protect, admin, toggleUserBlock);

module.exports = router;
