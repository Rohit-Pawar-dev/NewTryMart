const Product = require("../../models/Product");

exports.offersForYou = async (req, res) => {
  try {
    const { limit = 8, offset = 0 } = req.query;
    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = {
      status: 1,
      request_status: 1,
      is_offers: true, // Only products marked for offers
    };

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .populate("seller_id");

    res.json({
      message: "Offer products fetched",
      data: products,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
