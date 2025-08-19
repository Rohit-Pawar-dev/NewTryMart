const auth = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const User = require("../models/User");
const Seller = require("../models/Seller");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Admin = require("../models/Admin")
router.get("/profile", auth, async (req, res) => {
  var user = await User.findById(req.user.id);
  if (!user)
    return res
      .status(404)
      .json({ status: false, message: "User not found", data: {} });

  res.json({ status: true, message: "User Profile", data: user });
});

router.post("/update-profile", auth, async (req, res) => {
  var user = await User.findById(req.user.id);
  if (!user)
    return res
      .status(404)
      .json({ status: false, message: "User not found", data: {} });

  const updated_user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
  });

  res.json({
    status: true,
    message: "Profile updated success",
    data: updated_user,
  });
});

// Upload Media
router.post("/upload-media", upload.single("file"), async (req, res) => {
  try {
    res.status(200).json({
      message: "File uploaded successfully",
      file: process.env.MEDIA_URL + req.file.path.replace(/\\/g, "/"),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    // Calculate today's time range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Parallel user counts
    const [totalUsers, activeUsers, inactiveUsers, todaysUsers] =
      await Promise.all([
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "user", status: "active" }),
        User.countDocuments({ role: "user", status: "inactive" }),
        User.countDocuments({
          role: "user",
          created_at: { $gte: startOfDay, $lte: endOfDay },
        }),
      ]);

    // Seller count
    const totalSellers = await Seller.countDocuments();

    // Order status counts
    const orderStatuses = [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Returned",
    ];

    const statusCounts = await Promise.all(
      orderStatuses.map((status) =>
        Order.countDocuments({ status }).then((count) => ({ status, count }))
      )
    );

    // Format order status counts
    const orderStatusSummary = statusCounts.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item.count;
      return acc;
    }, {});

    // Total orders
    const totalOrders = await Order.countDocuments();

    // Product counts
    const [totalProducts, activeProducts, inactiveProducts] = await Promise.all(
      [
        Product.countDocuments(),
        Product.countDocuments({ status: 1 }),
        Product.countDocuments({ status: 0 }),
      ]
    );
    const deliveryStats = await Order.aggregate([
      { $match: { payment_status: "Paid" } },
      { $group: { _id: null, totalDeliveryCharges: { $sum: "$delivery_charge" } } },
    ]);

    //  const deliveryStats = await Order.aggregate([
    //   { 
    //     $match: { 
    //       payment_method: { $ne: "COD" }, 
    //       status: "Delivered",
    //       payment_status: "Paid"
    //     } 
    //   },
    //   { $group: { _id: null, totalDeliveryCharges: { $sum: "$delivery_charge" } } },
    // ]);


    const totalDeliveryCharges = deliveryStats[0]?.totalDeliveryCharges || 0;

    const admin = await Admin.findOne().select("admin_wallet seller_commission");

    // Final dashboard statistics
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
        ...orderStatusSummary, 
        delivery_charges_collected: totalDeliveryCharges,
        seller_commission_collected: admin?.seller_commission || 0,
        admin_wallet_balance: admin?.admin_wallet || 0,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
      },
    };

    return res.json({
      status: true,
      message: "Dashboard details",
      data: statistics,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
});

module.exports = router;
