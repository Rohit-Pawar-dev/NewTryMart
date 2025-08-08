const Seller = require('../../../models/Seller');

// Generate 4-digit OTP with leading zeros
function generateOTP() {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

// POST /sellers/login
const loginSeller = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        status: false,
        message: 'Mobile number is required',
      });
    }

    const seller = await Seller.findOne({ mobile });

    if (!seller) {
      return res.status(404).json({
        status: false,
        message: 'Seller with this mobile is not registered',
      });
    }

    const otp = generateOTP();
    seller.otp = otp;

    await seller.save();

    // TODO: send OTP via SMS here

    return res.status(200).json({
      status: true,
      otp, // Remove in production
      type: 'login',
      message: 'OTP sent to registered mobile number',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

// GET /sellers/me
const getMySellerProfile = async (req, res) => {
  try {
    const sellerId = req.user?.id || req.seller?._id;

    if (!sellerId) {
      return res.status(401).json({ status: false, message: 'Unauthorized' });
    }

    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({ status: false, message: 'Seller not found' });
    }

    return res.status(200).json({ status: true, data: seller });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};

// PUT /sellers/me
const updateMySellerProfile = async (req, res) => {
  try {
    const sellerId = req.user?.id || req.seller?._id;

    if (!sellerId) {
      return res.status(401).json({ status: false, message: 'Unauthorized' });
    }

    const updatedSeller = await Seller.findByIdAndUpdate(
      sellerId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedSeller) {
      return res.status(404).json({ status: false, message: 'Seller not found' });
    }

    return res.status(200).json({ status: true, data: updatedSeller });
  } catch (err) {
    return res.status(400).json({ status: false, error: err.message });
  }
};

// Export all controller methods
module.exports = {
  loginSeller,
  getMySellerProfile,
  updateMySellerProfile,
};
