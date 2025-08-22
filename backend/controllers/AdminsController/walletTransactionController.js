const WalletTransaction = require("../../models/WalletTransaction");


exports.getAdminWalletTransactions = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
   const adminId = req.user._id;
    const filter = { admin: { $ne: null } };

    if (adminId) {
      filter.admin = adminId;
    }

    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

 
    const total = await WalletTransaction.countDocuments(filter);
    const transactions = await WalletTransaction.find(filter)
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(200).json({
      status: true,
      message: "Admin wallet transactions fetched successfully",
      data: transactions,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching admin transactions:", error);
    return res.status(500).json({
      status: false,
      message: "Server error while fetching admin transactions",
      data: [],
      total: 0,
      limit: 10,
      offset: 0,
      totalPages: 0,
    });
  }
};
