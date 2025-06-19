const Seller = require('../../models/Seller'); // adjust path if needed

exports.getAllSellers = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = { status: "active" }; // You can customize this if needed

    const total = await Seller.countDocuments(filter);

    const sellers = await Seller.find(filter)
      .skip(parsedOffset)
      .limit(parsedLimit)
      .sort({ created_at: -1 });

    res.json({
      status: true,
      message: 'Sellers fetched successfully',
      data: sellers,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    console.error('Error fetching sellers:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
