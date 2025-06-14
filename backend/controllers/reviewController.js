const Review = require('../models/Review');

// Create
exports.create = async (req, res) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Read All with search, filter, pagination
exports.getAll = async (req, res) => {
  try {
    const { search = '', status, product_id, limit = 10, offset = 0 } = req.query;
    const filter = {};

    if (search) {
      filter.comment = { $regex: search, $options: 'i' };
    }

    if (status) {
      filter.status = status;
    }

    if (product_id) {
      filter.product_id = product_id;
    }

    const total = await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .populate('product_id user_id')// add order_id here when orders added
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    res.json({
      status: true,
      message: 'Reviews fetched successfully',
      data: reviews,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read One
exports.getOne = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('product_id user_id'); // add order_id here when orders added
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update
exports.update = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.remove = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
