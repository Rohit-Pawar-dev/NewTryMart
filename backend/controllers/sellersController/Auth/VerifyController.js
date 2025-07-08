const Seller = require("../../../models/Seller");

const verifyOtpSeller = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        status: false,
        message: "Mobile number and OTP are required",
      });
    }

    // Find seller by mobile number
    const seller = await Seller.findOne({ mobile });

    if (!seller) {
      return res.status(404).json({
        status: false,
        message: "No seller found with this mobile number",
      });
    }

    // Validate OTP
    if (seller.otp !== otp) {
      return res.status(401).json({
        status: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // Handle seller status
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
        // OTP is valid and seller is active
        seller.otp = null; // Clear OTP after success
        await seller.save();

        return res.status(200).json({
          status: true,
          type: "login-success",
          message: "Seller logged in successfully.",
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
