const Seller = require('../../../models/Seller');

// Generate 4-digit OTP with leading zeros
function generateOTP() {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

const loginSeller = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        status: false,
        message: 'Mobile number is required'
      });
    }

    // Find seller by mobile
    const seller = await Seller.findOne({ mobile });
    if (!seller) {
      return res.status(404).json({
        status: false,
        message: 'Seller with this mobile not registered'
      });
    }

    // Generate OTP and save it
    const otp = generateOTP();
    seller.otp = otp;
    await seller.save();

    // TODO: send OTP via SMS here

    return res.status(200).json({
      status: true,
      otp: otp,                 // For testing/demo; remove in production
      type: 'login',
      message: 'OTP sent to registered mobile number'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

module.exports = {
  loginSeller,
};
