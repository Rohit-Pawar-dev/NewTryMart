const BankInfo = require('../../models/SellerBankInfo');
const WithdrawalRequest = require('../../models/WithdrawalRequest');
const Seller = require('../../models/Seller');

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

exports.createRequest = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { amount } = req.body;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        status: false,
        message: 'Seller not found',
        data: null
      });
    }

    if (amount > seller.seller_wallet) {
      return res.status(400).json({
        status: false,
        message: 'Insufficient wallet balance',
        data: null
      });
    }

    const request = await WithdrawalRequest.create({
      seller_id: sellerId,
      amount,
    });

    return res.status(201).json({
      status: true,
      message: 'Withdrawal request created successfully',
      data: request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: 'Server error',
      data: null
    });
  }
};


exports.listSellerRequests = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, status, search } = req.query;

    // Filters
    let filter = { seller_id: sellerId };
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { status: { $regex: search, $options: 'i' } },
        { amount: Number(search) || -1 } // Only match if numeric
      ];
    }

    const skip = (page - 1) * limit;

    // Query
    const [requests, total] = await Promise.all([
      WithdrawalRequest.find(filter)
        .sort({ requested_at: -1 })
        .skip(Number(skip))
        .limit(Number(limit)),
      WithdrawalRequest.countDocuments(filter)
    ]);

    return res.json({
      status: true,
      message: 'Withdrawal requests retrieved successfully',
      data: requests,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)

    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: 'Server error',
      data: null
    });
  }
};
exports.getWalletBalance = async (req, res) => {
  try {
    const sellerId = req.user.id; 

    const seller = await Seller.findById(sellerId).select('seller_wallet');
    if (!seller) {
      return res.status(404).json({
        status: false,
        message: 'Seller not found',
        data: null
      });
    }

    return res.json({
      status: true,
      message: 'Wallet balance retrieved successfully',
      data: {
        wallet_amount: seller.seller_wallet
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: 'Server error',
      data: null
    });
  }
};
