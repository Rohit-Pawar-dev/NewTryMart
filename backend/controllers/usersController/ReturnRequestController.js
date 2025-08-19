// controllers/returnRequestController.js
const ReturnRequest = require('../../models/ReturnRequests');
const Order = require("../../models/Order");
const path = require('path'); 
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
    const user_id = req.user.id; // authenticated user
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
  // Return relative path for frontend to use
  const filePath = path.join('uploads', 'return_requests', req.file.filename).replace(/\\/g, '/');
  res.status(201).json({ path: filePath });
};