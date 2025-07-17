const Cart = require("../../models/Cart");
const Order = require("../../models/Order");
const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const Product = require("../../models/Product");
const nlogger = require("../../logger");
const PDFDocument = require("pdfkit");
const OrderItemDetail = require("../../models/OrderDetails");

const fs = require("fs");
const path = require("path");

// Admin Order Listing (with search + pagination)
async function getOrders(req, res) {
  try {
    const searchText = req.query.search ?? "";
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.order_status;
    const startDate = req.query.startDate; // Expecting ISO string or YYYY-MM-DD
    const endDate = req.query.endDate;

    // Build user search filter
    const userFilter = {
      $or: [
        { name: { $regex: searchText, $options: "i" } },
        { mobile: { $regex: searchText, $options: "i" } },
      ],
    };

    const matchingUsers = await User.find(userFilter).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    // Build main order filter
    const filter = {};

    // Filter by customer_id if searchText is present
    if (searchText) {
      filter.customer_id = { $in: userIds };
    }

    // Filter by status if provided
    if (status) {
      filter.status = status;
    }

    // Filter orders between dates if both provided
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the endDate fully (optional)
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

const getTransactions = async (req, res) => {
  try {
    const searchText = req.query.search || "";
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const paymentStatus = req.query.status; // Optional filter
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

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

    const total = await Transaction.countDocuments(filter);

    const transactions = await Transaction.find(filter)
      .populate({
        path: "order_id",
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
      data: transactions,
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
// Generate and download invoice as PDF
// async function downloadInvoice(req, res) {
//   try {
//     const orderId = req.params.id;

//     const order = await Order.findById(orderId)
//       .populate("customer_id", "name email mobile")
//       .populate("seller_id", "shop_name mobile email")
//       .populate("shipping_address")
//       .populate({
//         path: "order_items",
//         populate: {
//           path: "product_id",
//           select: "name price thumbnail",
//         },
//       });

//     if (!order) {
//       return res.status(404).json({ status: false, message: "Order not found" });
//     }

//     const doc = new PDFDocument({ margin: 30 });
//     const filename = `invoice_${orderId}.pdf`;
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
//     res.setHeader("Content-Type", "application/pdf");

//     doc.pipe(res);

//     doc.fontSize(20).text("Order Invoice", { align: "center" });
//     doc.moveDown();
//     doc.fontSize(12).text(`Order ID: ${order._id}`);
//     doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
//     doc.text(`Customer: ${order.customer_id.name} (${order.customer_id.mobile})`);
//     doc.text(`Email: ${order.customer_id.email || "-"}`);
//     doc.text(`Shipping Address: ${typeof order.shipping_address === "object" ? order.shipping_address?.address_line : "N/A"}`);
//     doc.moveDown();

//     doc.fontSize(14).text("Items:", { underline: true });
//     doc.moveDown(0.5);

//     order.order_items.forEach((item, i) => {
//       doc
//         .fontSize(12)
//         .text(`${i + 1}. ${item.product_id?.name || "Unknown Product"} x ${item.quantity} @ ₹${item.price}`, { indent: 10 });
//     });

//     doc.moveDown();
//     doc.text(`Subtotal: ₹${order.total_price}`, { align: "right" });
//     doc.text(`Shipping: ₹${order.shipping_cost || 0}`, { align: "right" });
//     doc.text(`Discount: -₹${order.coupon_amount || 0}`, { align: "right" });
//     doc.moveDown(0.5);
//     doc.fontSize(14).text(`Total: ₹${(order.total_price + (order.shipping_cost || 0) - (order.coupon_amount || 0)).toFixed(2)}`, { align: "right" });

//     doc.moveDown(2);
//     doc.fontSize(10).text("Thank you for your order!", { align: "center" });

//     doc.end();
//   } catch (err) {
//     console.error("Error generating invoice:", err);
//     res.status(500).json({ status: false, message: "Failed to generate invoice" });
//   }
// }


async function downloadInvoice(req, res) {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate("customer_id", "name email mobile")
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

    const doc = new PDFDocument({ margin: 30 });
    const filename = `invoice_${orderId}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // ---- Header
    doc.fontSize(20).text("Tax Invoice", { align: "center" }).moveDown();

    // ---- Order + Customer Info
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Customer: ${order.customer_id.name}`);
    doc.text(`Phone: ${order.customer_id.mobile}`);
    doc.text(`Email: ${order.customer_id.email || "-"}`);
    doc.text(`Shipping Address: ${order.shipping_address?.address_line || "-"}`);
    doc.moveDown();

    // ---- Table Header
    doc.fontSize(14).text("Order Items", { underline: true }).moveDown(0.5);
    doc.fontSize(12);
    doc.text("No", 50, doc.y, { continued: true });
    doc.text("Product", 80, doc.y, { continued: true });
    doc.text("Variant", 200, doc.y, { continued: true });
    doc.text("Qty", 300, doc.y, { continued: true });
    doc.text("Unit Price", 340, doc.y, { continued: true });
    doc.text("Total", 420, doc.y);
    doc.moveDown(0.5);

    let subtotal = 0;

    order.order_items.forEach((item, index) => {
      const name = item.name || item.product_id?.name || "Unnamed Product";
      const variant = Object.entries(item.selected_variant || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");

      const qty = item.quantity;
      const unitPrice = item.unit_price;
      const totalPrice = item.total_price;

      subtotal += totalPrice;

      doc.text(`${index + 1}`, 50, doc.y, { continued: true });
      doc.text(`${name}`, 80, doc.y, { continued: true });
      doc.text(`${variant || "-"}`, 200, doc.y, { continued: true });
      doc.text(`${qty}`, 300, doc.y, { continued: true });
      doc.text(`₹${unitPrice.toFixed(2)}`, 340, doc.y, { continued: true });
      doc.text(`₹${totalPrice.toFixed(2)}`, 420, doc.y);
    });

    doc.moveDown();

    // ---- Totals
    const shipping = order.shipping_cost || 0;
    const discount = order.coupon_amount || 0;
    const grandTotal = subtotal + shipping - discount;

    doc.fontSize(12).text(`Subtotal: ₹${subtotal.toFixed(2)}`, { align: "right" });
    doc.text(`Shipping: ₹${shipping.toFixed(2)}`, { align: "right" });
    doc.text(`Discount: -₹${discount.toFixed(2)}`, { align: "right" });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Grand Total: ₹${grandTotal.toFixed(2)}`, { align: "right" });

    doc.moveDown(2);
    doc.fontSize(10).text("Thank you for shopping with us!", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("Error generating invoice:", err);
    res.status(500).json({ status: false, message: "Failed to generate invoice" });
  }
}



module.exports = {
  getOrders,
  getOrderById,
  getTransactions,
  downloadInvoice
};
