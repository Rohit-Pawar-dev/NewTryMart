const ReturnRequest = require('../../models/ReturnRequests');
const User = require("../../models/User");  
const Seller = require("../../models/Seller");  
const Order = require("../../models/Order");


// exports.getAllReturnRequests = async (req, res) => {
//   try {
//     const { status, search } = req.query;

//     let filter = {};

//     //  Filter by status only
//     if (status) {
//       filter.status = status;
//     }

//     // Fetch data with populate
//     const requests = await ReturnRequest.find(filter)
//       .populate({
//         path: "user_id",
//         select: "name email mobile", 
//       })
//       .populate({
//         path: "seller_id",
//         select: "name shop_name mobile", 
//       })
//       .populate({
//         path: "order_id",
//         select: "order_id total_price status payment_status", 
//       })
//       .sort({ createdAt: -1 });

//     let finalRequests = requests;

//     //  Apply search across multiple fields
//     if (search) {
//       const regex = new RegExp(search, "i");
//       finalRequests = requests.filter(
//         (r) =>
//           regex.test(r.reason || "") ||
//           regex.test(r.description || "") ||
//           regex.test(r.user_id?.name || "") ||
//           regex.test(r.user_id?.mobile || "") ||
//           regex.test(r.seller_id?.name || "") ||
//           regex.test(r.seller_id?.shop_name || "") ||
//           regex.test(r.order_id?.order_id?.toString() || "")
//       );
//     }

//     res.json({ status: true, data: finalRequests });
//   } catch (err) {
//     res.status(500).json({ status: false, message: err.message });
//   }
// };
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

    // Base filter
    const filter = {};
    if (status) filter.status = status;

    // Fetch all requests with base filter
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
      .lean(); // Use lean() for faster queries

    // Apply search across multiple fields
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

    if (!['Approved', 'Denied'].includes(status)) {
      return res.status(400).json({
        status: false,
        message: 'Status must be either Approved or Denied',
      });
    }

    const request = await ReturnRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ status: false, message: 'Return request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ status: false, message: 'Only pending requests can be updated' });
    }

    // Update return request
    request.status = status;
    request.admin_response = admin_response || null;
    request.updated_by = req.admin?._id; 
    await request.save();

    // If approved, update order status to Returned
    if (status === 'Approved') {
      await Order.findByIdAndUpdate(request.order_id, { status: 'Returned' });
    }

    res.json({
      status: true,
      message: `Return request ${status.toLowerCase()} successfully`,
      data: request,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};