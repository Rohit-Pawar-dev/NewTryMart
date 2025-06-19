const auth = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const User = require('../models/User');
const Seller = require('../models/Seller')     
const Order = require('../models/Order');
const Product = require('../models/Product');;
router.get('/profile', auth, async (req, res) => {

    var user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ status:false, message: 'User not found', data:{} });

    res.json({status:true, message: 'User Profile', data:user});
});

router.post('/update-profile', auth, async (req, res) => {

    var user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ status:false, message: 'User not found', data:{} });

    const updated_user = await User.findByIdAndUpdate(
        req.user.id, req.body, { new: true }
    );

    res.json({ status:true, message: 'Profile updated success', data:updated_user });
});



// Upload Media
router.post('/upload-media', upload.single('file'), async (req, res) => {
  try {
    res.status(200).json({ message: 'File uploaded successfully', file: process.env.MEDIA_URL + req.file.path.replace(/\\/g, '/') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




router.get('/dashboard', async (req, res) => {
    try {
        // Today's users
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todaysUsers = await User.countDocuments({
            role: "user",
            created_at: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        // Total users
        const totalUsers = await User.countDocuments({ role: "user" });

        // Active users
        const activeUsers = await User.countDocuments({ role: "user", status: "active" });

        // Inactive users
        const inactiveUsers = await User.countDocuments({ role: "user", status: "inactive" });

        // Sellers
        const totalSellers = await Seller.countDocuments();

        // Orders by status
        const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
        const orderCountsByStatus = {};

        for (const status of orderStatuses) {
            orderCountsByStatus[status.toLowerCase()] = await Order.countDocuments({ status });
        }

        const totalOrders = await Order.countDocuments();

        // Products
        const totalProducts = await Product.countDocuments();
        const activeProducts = await Product.countDocuments({ status: 1 });
        const inactiveProducts = await Product.countDocuments({ status: 0 });

        const statistics = {
            users: {
                total: totalUsers,
                active: activeUsers,
                inactive: inactiveUsers,
                today: todaysUsers,
            },
            sellers: {
                total: totalSellers,
            },
            orders: {
                total: totalOrders,
                ...orderCountsByStatus,
            },
            products: {
                total: totalProducts,
                active: activeProducts,
                inactive: inactiveProducts,
            },
        };

        return res.json({
            status: true,
            message: 'Dashboard details',
            data: statistics
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
});

module.exports = router;


module.exports = router;