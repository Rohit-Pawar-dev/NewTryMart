const Order = require("../../models/Order");
const Transaction = require("../../models/Transaction");
const User = require("../../models/User");
const OrderItemDetail = require("../../models/OrderDetails");

const mongoose = require("mongoose");

exports.getSellerOrders = async (req, res) => {
  try {
    const searchText = req.query.search ?? "";
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.order_status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const sellerId = req.user?.id || req.query.sellerId;
    if (!sellerId) {
      return res.status(400).json({ status: false, message: "Seller ID is required" });
    }

    const userFilter = {
      $or: [
        { name: { $regex: searchText, $options: "i" } },
        { mobile: { $regex: searchText, $options: "i" } },
      ],
    };

    const matchingUsers = await User.find(userFilter).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    const filter = {
      seller_id: sellerId, 
    };

    if (searchText) {
      filter.customer_id = { $in: userIds };
    }

    if (status) {
      filter.status = { $regex: `^${status}$`, $options: "i" };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
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
      message: "Seller orders fetched successfully",
      data: orders,
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    nlogger.error("Error retrieving seller orders", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}


exports.getSellerOrderById = async (req, res) => {
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
      return res.status(404).json({ status: false, message: "Order not found" });
    }
    order = order.toObject();
    const orderCount = await Order.countDocuments({
      customer_id: order.customer_id._id,
    });
    order.customer_order_count = orderCount;
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of order.order_items) {
      subtotal += item.unit_price * item.quantity;
      totalDiscount += (item.discount || 0) * item.quantity;
      totalTax += (item.tax || 0) * item.quantity;
    }

    const couponAmount = order.coupon_amount || 0;
    const deliveryCharge = order.delivery_charge || 0;

    const finalPayable = subtotal - totalDiscount + totalTax - couponAmount + deliveryCharge;

    order.breakdown = {
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      couponAmount: parseFloat(couponAmount.toFixed(2)),
      deliveryCharge: parseFloat(deliveryCharge.toFixed(2)),
      finalPayable: parseFloat(finalPayable.toFixed(2)),
    };

    return res.status(200).json({
      status: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (err) {
    console.error("Error fetching order by ID", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

exports.getSellerTransactions = async (req, res) => {
  try {
    const searchText = req.query.search || "";
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const paymentStatus = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const sellerId = req.user?.id || req.seller?.id || req.query.sellerId;

    if (!sellerId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized: Seller ID missing",
      });
    }

    const userFilter = {
      $or: [
        { name: { $regex: searchText, $options: "i" } },
        { mobile: { $regex: searchText, $options: "i" } },
      ],
    };

    let userIds = [];
    if (searchText) {
      const matchingUsers = await User.find(userFilter).select("_id");
      userIds = matchingUsers.map((u) => u._id);
    }

    const filter = {};

    if (userIds.length > 0) {
      filter.user_id = { $in: userIds };
    }

    if (paymentStatus) {
      filter.payment_status = paymentStatus;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    filter["order_id.seller_id"] = sellerId;

    const total = await Transaction.countDocuments(filter);

    const transactions = await Transaction.find(filter)
      .populate({
        path: "order_id",
        match: { seller_id: sellerId }, 
        populate: [
          { path: "customer_id", model: "User" },
          { path: "seller_id", model: "Seller" },
          { path: "shipping_address", model: "Address" },
          { path: "order_items", model: "OrderItemDetail" },
        ],
      })
      .populate("user_id", "name email mobile role")
      .populate("paid_by", "name email mobile")
      .populate("paid_to", "name email mobile")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      status: true,
      message: "Transactions fetched successfully",
      data: transactions.filter(t => t.order_id), 
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error("Error fetching transactions:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

