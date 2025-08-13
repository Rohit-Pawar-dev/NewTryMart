const WithdrawalRequest = require('../../models/WithdrawalRequest');
const Seller = require('../../models/Seller');

// List withdrawal requests with pagination, search, and filter
exports.listAllRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    let query = {};

    // Status filter
    if (status) {
      query.status = status.toLowerCase();
    }

    // Search filter
    if (search) {
      const orConditions = [{ status: { $regex: search, $options: 'i' } }];
      if (!isNaN(Number(search))) {
        orConditions.push({ amount: Number(search) });
      }
      query.$or = orConditions;
    }

    const totalCount = await WithdrawalRequest.countDocuments(query);

    const requests = await WithdrawalRequest.find(query)
      .populate('seller_id', 'name email')
      .sort({ requested_at: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      status: true,
      message: "Withdrawal requests fetched successfully",
      data: requests,
      meta: {
        total: totalCount,
        page: Number(page),
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

//  View a single withdrawal request
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await WithdrawalRequest.findById(id)
      .populate('seller_id', 'name email');

    if (!request) {
      return res.status(404).json({ status: false, message: 'Request not found' });
    }

    res.json({ status: true, data: request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

//  Update withdrawal request status
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    const request = await WithdrawalRequest.findById(id);
    if (!request) {
      return res.status(404).json({ status: false, message: 'Request not found' });
    }

    if (status === 'approved') {
      const seller = await Seller.findById(request.seller_id);
      if (!seller) {
        return res.status(404).json({ status: false, message: 'Seller not found' });
      }

      if (request.amount > seller.seller_wallet) {
        return res.status(400).json({ status: false, message: 'Seller has insufficient wallet balance' });
      }

      seller.seller_wallet -= request.amount;
      await seller.save();
    }

    request.status = status;
    request.admin_note = admin_note;
    request.processed_at = new Date();
    await request.save();

    res.json({ status: true, message: 'Request updated successfully', data: request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};
