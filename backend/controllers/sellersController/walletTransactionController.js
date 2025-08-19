const WalletTransaction = require("../../models/WalletTransaction");

exports.getSellerWalletTransactions = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
   const sellerId = req.user._id;
    const filter = { seller: { $ne: null } };

    if (sellerId) {
      filter.seller = sellerId;
    }

    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    // Fetch total count
    const total = await WalletTransaction.countDocuments(filter);

    // Fetch paginated results
    const transactions = await WalletTransaction.find(filter)
      .populate("seller", "name email")
      .sort({ createdAt: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(200).json({
      status: true,
      message: "Seller wallet transactions fetched successfully",
      data: transactions,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching seller transactions:", error);
    return res.status(500).json({
      status: false,
      message: "Server error while fetching seller transactions",
      data: [],
      total: 0,
      limit: 10,
      offset: 0,
      totalPages: 0,
    });
  }
};