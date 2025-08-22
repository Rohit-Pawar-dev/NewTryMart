// controllers/returnRequestController.js
const ReturnRequest = require('../../models/ReturnRequests');
const Order = require("../../models/Order");
const path = require('path');
const OrderItemDetail = require("../../models/OrderDetails");
const User = require("../../models/User");
const Seller = require("../../models/Seller");
const Admin = require("../../models/Admin");
const WalletTransaction = require("../../models/WalletTransaction");


exports.createReturnRequest = async (req, res) => {
  try {
    const { order_id, seller_id, reason, description, proof_images } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!order_id || !reason) {
      return res.status(400).json({
        status: false,
        message: 'order_id and reason are required',
      });
    }

    // Check if the order exists
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({
        status: false,
        message: 'Order not found',
      });
    }

    // Prevent multiple return requests for the same order
    const existingRequest = await ReturnRequest.findOne({ order_id, user_id });
    if (existingRequest) {
      return res.status(400).json({
        status: false,
        message: 'Return request already exists for this order',
      });
    }

    // Create the return request
    const returnRequest = new ReturnRequest({
      order_id,
      user_id,
      seller_id,
      reason,
      description,
      proof_images,
    });

    await returnRequest.save();

    res.status(201).json({
      status: true,
      message: 'Return request created successfully',
      data: returnRequest,
    });

  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.getReturnRequestByOrder = async (req, res) => {
  try {
    const user_id = req.user.id; r
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({
        status: false,
        message: 'Order ID is required',
      });
    }

    const request = await ReturnRequest.findOne({ order_id, user_id });

    if (!request) {
      return res.status(200).json({
        status: true,
        message: 'No return request found for this order',
        data: null,
      });
    }

    res.status(200).json({
      status: true,
      message: 'Return request found',
      data: request,
    });

  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.uploadReturnImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = path.join('uploads', 'return_requests', req.file.filename).replace(/\\/g, '/');
  res.status(201).json({ path: filePath });
};

exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, customer_id: userId });
    if (!order) {
      return res.status(404).json({ status: false, message: "Order not found" });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ status: false, message: "Order already cancelled" });
    }


    if (order.payment_status === "Unpaid") {
      order.status = "Cancelled";
      await order.save();
      return res.json({ status: true, message: "Order cancelled successfully (Unpaid)" });
    }


    if (order.payment_status === "Paid") {
      const user = await User.findById(userId);
      const admin = await Admin.findOne();
      if (!admin) {
        return res.status(500).json({ status: false, message: "Admin config missing" });
      }

      const refundAmount = order.total_price;

      if (order.seller_is === "seller") {
        const sellerShare = order.total_price - (order.admin_commission + order.delivery_charge);

        admin.admin_wallet -= (order.admin_commission + order.delivery_charge);
        admin.seller_commission -= order.admin_commission;
        
        await new WalletTransaction({
          admin: admin._id,
          type: "debit",
          amount: (order.admin_commission + order.delivery_charge),
          balanceAfter: admin.admin_wallet,
          description: `Commission reversal for cancelled order #${order.order_id} with delivery charge`,
        }).save();

        const seller = await Seller.findById(order.seller_id);
        seller.seller_wallet -= sellerShare;
        await new WalletTransaction({
          seller: seller._id,
          type: "debit",
          amount: sellerShare,
          balanceAfter: seller.seller_wallet,
          description: `Reversal for cancelled order #${order.order_id}`,
        }).save();
        await seller.save();

        user.wallet_amount += refundAmount;
        await new WalletTransaction({
          user: user._id,
          type: "credit",
          amount: refundAmount,
          balanceAfter: user.wallet_amount,
          description: `Refund for cancelled order #${order.order_id}`,
        }).save();
      } else {

        admin.admin_wallet -= refundAmount;
        await new WalletTransaction({
          admin: admin._id,
          type: "debit",
          amount: refundAmount,
          balanceAfter: admin.admin_wallet,
          description: `Refund for cancelled order #${order.order_id}`,
        }).save();

        user.wallet_amount += refundAmount;
        await new WalletTransaction({
          user: user._id,
          type: "credit",
          amount: refundAmount,
          balanceAfter: user.wallet_amount,
          description: `Refund for cancelled order #${order.order_id}`,
        }).save();
      }

      await user.save();
      await admin.save();


      order.status = "Cancelled";
      order.payment_status = "Refunded";
      await order.save();

      return res.json({ status: true, message: "Order cancelled & refunded successfully" });
    }

    return res.status(400).json({ status: false, message: "Invalid order state for cancellation" });

  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({ status: false, message: "Server error", error: err.message });
  }
};
