const Seller = require("../../../models/Seller");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const verifyOtpSeller = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({
        status: false,
        message: "Mobile number and OTP are required",
      });
    }
    const seller = await Seller.findOne({ mobile });
    if (!seller) {
      return res.status(404).json({
        status: false,
        message: "No seller found with this mobile number",
      });
    }
    if (String(seller.otp).trim() !== String(otp).trim()) {
      return res.status(401).json({
        status: false,
        message: "Invalid OTP. Please try again.",
      });
    }
    switch (seller.status) {
      case "inactive":
        return res.status(403).json({
          status: false,
          message:
            "Your account is under review. Please wait for admin approval.",
        });
      case "blocked":
        return res.status(403).json({
          status: false,
          message: "Your account has been blocked. Please contact support.",
        });
      case "active":
        seller.otp = null;
        await seller.save();
        const token = jwt.sign(
          {
            id: seller._id,
            mobile: seller.mobile,
            role: 'seller',
          },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
        return res.status(200).json({
          status: true,
          type: "login-success",
          message: "Seller logged in successfully.",
          token,
          seller: {
            id: seller._id,
            name: seller.name,
            mobile: seller.mobile,
            email: seller.email,
            status: seller.status,
          },
        });
      default:
        return res.status(500).json({
          status: false,
          message: "Unexpected account status. Please contact support.",
        });
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
module.exports = {
  verifyOtpSeller,
};
