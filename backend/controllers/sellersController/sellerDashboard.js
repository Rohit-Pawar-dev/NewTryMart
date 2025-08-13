const Product = require("../../models/Product");
const Seller = require("../../models/Seller");
const Order = require("../../models/Order");

exports.sellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const totalProducts = await Product.countDocuments({ seller_id: sellerId });
    const seller = await Seller.findById(sellerId).select("seller_wallet");
    const totalEarnings = seller?.seller_wallet || 0;

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
        Order.countDocuments({ seller_id: sellerId, status })
          .then((count) => ({ status, count }))
      )
    );
    const orderStatusSummary = statusCounts.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item.count;
      return acc;
    }, {});
    const totalOrders = Object.values(orderStatusSummary)
      .reduce((sum, count) => sum + count, 0);
    const statistics = {
      products: {
        total: totalProducts,
      },
      earnings: totalEarnings,
      orders: {
        total: totalOrders,
        ...orderStatusSummary,
      },
    };
    return res.json({
      status: true,
      message: "Seller dashboard details",
      data: statistics,
    });

  } catch (error) {
    console.error("Seller Dashboard Error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
