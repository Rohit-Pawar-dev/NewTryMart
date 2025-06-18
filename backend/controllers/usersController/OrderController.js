const Order = require("../../models/Order");
const OrderItemDetail = require("../../models/OrderDetails");

/**
 * Get all orders for the authenticated user
 */
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ customer_id: userId })
      .populate({
        path: "order_items",
        populate: {
          path: "seller_id",
          select: "shop_name",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message: "User orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    console.error("Error fetching user orders:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

/**
 * Get a specific order by ID for the authenticated user
 */
const getUserOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer_id: req.user.id,
    })
      .populate("customer_id", "name email mobile")
      .populate("shipping_address") 
      .populate({
        path: "order_items",
        populate: [
          {
            path: "product_id",
            select: "name thumbnail",
          },
          {
            path: "seller_id",
            select: "shop_name",
          },
        ],
      });

    if (!order) {
      return res.status(404).json({
        status: false,
        message: "Order not found or unauthorized",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (err) {
    console.error("Error fetching order by ID:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

module.exports = {
  getUserOrders,
  getUserOrderById,
};
