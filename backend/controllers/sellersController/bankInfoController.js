const BankInfo = require('../../models/SellerBankInfo');

// Get bank info by seller ID
exports.getBankInfo = async (req, res) => {
  try {
    const sellerId = req.user.id;
    // console.log(sellerId);

    const bankInfo = await BankInfo.findOne({ seller_id: sellerId });

    if (!bankInfo) {
      return res.json({
        status: false,
        message: "Bank info not found",
        data: {
          seller_id: sellerId,
          account_holder_name: null,
          bank_name: null,
          account_number: null,
          ifsc_code: null,
          branch_name: null,
          upi_id: null,
          status: 0,
        },
      });
    }

    res.json({
      status: true,
      message: "Bank info retrieved successfully",
      data: bankInfo,
    });
  } catch (error) {
    console.error("Error fetching bank info:", error);
    res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Edit bank info by seller ID
exports.editBankInfo = async (req, res) => {
  try {
    const sellerId = req.user.id; 
    const updateData = req.body;
    updateData.seller_id = sellerId;
    const bankInfo = await BankInfo.findOneAndUpdate(
      { seller_id: sellerId },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      status: true,
      message: "Bank info updated successfully",
      data: bankInfo,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};