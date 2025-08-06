const Review = require("../../models/Review");
const path = require('path');

// Create multiple
exports.create = async (req, res) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const {
      search = "",
      status,
      product_id,
      limit = 10,
      offset = 0,
    } = req.query;
    const filter = {};

    if (search) {
      filter.comment = { $regex: search, $options: "i" };
    }

    if (status) {
      filter.status = status;
    }

    if (product_id) {
      filter.product_id = product_id;
    }

    const total = await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .populate("product_id user_id") 
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    res.json({
      status: true,
      message: "Reviews fetched successfully",
      data: reviews,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read One
exports.getOne = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate(
      "product_id user_id"
    ); // add order_id here when orders added
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update
exports.update = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.remove = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};




exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Return relative path for frontend to use
  const filePath = path.join('uploads', 'reviews', req.file.filename).replace(/\\/g, '/');
  res.status(201).json({ path: filePath });
};

// Get reviews by order_id and user_id (for Angular to check submitted ones)
exports.getByOrderAndUser = async (req, res) => {
  try {
    const { order_id, user_id } = req.query;

    if (!order_id || !user_id) {
      return res.status(400).json({ error: "order_id and user_id are required" });
    }

    const reviews = await Review.find({ order_id, user_id });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }



};
