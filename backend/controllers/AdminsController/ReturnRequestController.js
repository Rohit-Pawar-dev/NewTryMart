const ReturnRequest = require('../../models/ReturnRequests');
const User = require("../../models/User");
const Seller = require("../../models/Seller");
const Order = require("../../models/Order");
const Admin = require("../../models/Admin");
const WalletTransaction = require("../../models/WalletTransaction");


exports.getAllReturnRequests = async (req, res) => {
  try {
    const {
      status,
      search = "",
      limit = 10,
      offset = 0,
    } = req.query;

    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));


    const filter = {};
    if (status) filter.status = status;

    let requests = await ReturnRequest.find(filter)
      .populate({
        path: "user_id",
        select: "name email mobile",
      })
      .populate({
        path: "seller_id",
        select: "name shop_name mobile",
      })
      .populate({
        path: "order_id",
        select: "order_id total_price status payment_status",
      })
      .sort({ createdAt: -1 })
      .lean();


    if (search) {
      const regex = new RegExp(search, "i");
      requests = requests.filter(
        (r) =>
          regex.test(r.reason || "") ||
          regex.test(r.description || "") ||
          regex.test(r.user_id?.name || "") ||
          regex.test(r.user_id?.mobile || "") ||
          regex.test(r.seller_id?.name || "") ||
          regex.test(r.seller_id?.shop_name || "") ||
          regex.test(r.order_id?.order_id?.toString() || "")
      );
    }

    const total = requests.length;

    // Apply pagination
    const paginated = requests.slice(parsedOffset, parsedOffset + parsedLimit);

    res.json({
      status: true,
      message: "Return requests fetched successfully",
      data: paginated,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.getReturnRequestById = async (req, res) => {
  try {
    const request = await ReturnRequest.findById(req.params.id)
      .populate('order_id user_id seller_id');

    if (!request) {
      return res.status(404).json({ status: false, message: 'Return request not found' });
    }

    res.json({ status: true, data: request });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};


exports.changeReturnRequestStatus = async (req, res) => {
  try {
    const { status, admin_response } = req.body;
    const validStatuses = ["Approved", "Denied", "Returned"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Invalid status. Must be one of: Approved, Denied, Returned.",
      });
    }

    const returnRequestId = req.params.id;
    if (!returnRequestId) {
      return res.status(400).json({
        status: false,
        message: "Missing return request ID in parameters.",
      });
    }

    const request = await ReturnRequest.findById(returnRequestId).populate("order_id");
    if (!request) {
      return res.status(404).json({
        status: false,
        message: "Return request not found.",
      });
    }


    if (request.status === "Returned") {
      return res.status(400).json({
        status: false,
        message: "Cannot update a return request that is already marked as Returned.",
      });
    }

    const order = await Order.findById(request.order_id);
    if (!order) {
      return res.status(404).json({ status: false, message: "Associated order not found" });
    }


    request.status = status;
    request.admin_response = admin_response?.trim() || null;
    request.updated_by = req?.admin?._id || null;
    await request.save();

    if (status === "Returned") {
      const user = await User.findById(order.customer_id);
      const admin = await Admin.findOne();
      if (!admin) {
        return res.status(500).json({ status: false, message: "Admin config missing" });
      }

      const refundAmount = order.total_price;

      if (order.seller_is === "seller") {

        const sellerShare = refundAmount - (order.admin_commission + order.delivery_charge);

        const seller = await Seller.findById(order.seller_id);
        if (!seller) {
          return res.status(404).json({ status: false, message: "Seller not found" });
        }


        seller.seller_wallet -= sellerShare;


        admin.admin_wallet -= (order.admin_commission + order.delivery_charge);
        admin.seller_commission -= order.admin_commission;


        user.wallet_amount += refundAmount;


        await new WalletTransaction({
          user: user._id,
          type: "credit",
          amount: refundAmount,
          balanceAfter: user.wallet_amount,
          description: `Refund for returned order #${order._id}`,
        }).save();

        await new WalletTransaction({
          seller: seller._id,
          type: "debit",
          amount: sellerShare,
          balanceAfter: seller.seller_wallet,
          description: `Seller share deducted for returned order #${order._id}`,
        }).save();

        await new WalletTransaction({
          admin: admin._id,
          type: "debit",
          amount: (order.admin_commission + order.delivery_charge),
          balanceAfter: admin.admin_wallet,
          description: `Commission refunded for returned order #${order._id} with delivery charge`,
        }).save();

        await seller.save();

      } else {
        admin.admin_wallet -= refundAmount;
        user.wallet_amount += refundAmount;

        await new WalletTransaction({
          user: user._id,
          type: "credit",
          amount: refundAmount,
          balanceAfter: user.wallet_amount,
          description: `Refund for returned admin order #${order._id}`,
        }).save();

        await new WalletTransaction({
          admin: admin._id,
          type: "debit",
          amount: refundAmount,
          balanceAfter: admin.admin_wallet,
          description: `Refund processed for admin order #${order._id} with delivery charge`,
        }).save();
      }

      await user.save();
      await admin.save();

      order.status = "Returned";
      order.payment_status = "Refunded";
      await order.save();
    }

    if (status === "Denied") {
      await Order.findByIdAndUpdate(order._id, { status: "Delivered" });
    }


    if (status === "Approved") {
      await Order.findByIdAndUpdate(order._id, { status: "Delivered" });
    }

    return res.status(200).json({
      status: true,
      message: `Return request ${status.toLowerCase()} successfully.`,
      data: request,
    });
  } catch (err) {
    console.error("Error updating return request:", err);
    return res.status(500).json({
      status: false,
      message: "An error occurred while updating the return request.",
      error: err.message,
    });
  }
};

