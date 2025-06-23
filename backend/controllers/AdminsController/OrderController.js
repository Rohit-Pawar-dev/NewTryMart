const Cart = require("../../models/Cart");
const Order = require("../../models/Order");
const User = require("../../models/User");
const nlogger = require("../../logger");

// Admin Order Listing (with search + pagination)
async function getOrders(req, res) {
  try {
    const searchText = req.query.search ?? "";
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const userFilter = {
      $or: [
        { name: { $regex: searchText, $options: "i" } },
        { mobile: { $regex: searchText, $options: "i" } },
      ],
    };

    const matchingUsers = await User.find(userFilter).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    const filter = searchText ? { customer_id: { $in: userIds } } : {};

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate("customer_id", "name mobile email profilePicture")
      .populate("order_items")
      .populate("seller_id")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      status: true,
      message: "Orders fetched successfully",
      data: orders,
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    nlogger.error("Error retrieving orders", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

// Get Single Order by ID
async function getOrderById(req, res) {
  try {
    let order = await Order.findById(req.params.id)
      .populate("customer_id", "name email mobile profilePicture")
      .populate("seller_id", "shop_name mobile email")
      .populate("shipping_address")
      .populate({
        path: "order_items",
        populate: {
          path: "product_id",
          select: "name thumbnail",
        },
      });

    if (!order) {
      return res
        .status(404)
        .json({ status: false, message: "Order not found" });
    }

    // 👇 Convert to plain object to append custom data
    order = order.toObject();

    // 👇 Count total orders by the same customer
    const orderCount = await Order.countDocuments({
      customer_id: order.customer_id._id,
    });

    // 👇 Attach order count
    order.customer_order_count = orderCount;

    return res.status(200).json({
      status: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (err) {
    console.error("Error fetching order by ID", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

module.exports = {
  getOrders,
  getOrderById,
};
