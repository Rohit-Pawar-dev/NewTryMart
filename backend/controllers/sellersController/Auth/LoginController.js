const Seller = require('../../../models/Seller');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


// Generate 4-digit OTP with leading zeros
function generateOTP() {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

// POST /sellers/login

const otpLoginSeller = async (req, res) => {
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

    // Generate OTP and save it to the seller document
    const otp = generateOTP();
    seller.otp = otp;

    await seller.save();

    // TODO: send OTP via SMS here (using an external service like Twilio)

    return res.status(200).json({
      status: true,
      otp, // Remove this in production and send via SMS
      type: 'otp',
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

// const emailPasswordLoginSeller = async (req, res) => {
//   try {
//     const { mobile, email, password } = req.body;

//     if (!mobile && !email) {
//       return res.status(400).json({
//         status: false,
//         message: 'Mobile number or email is required',
//       });
//     }

//     let seller;

//     // Check if the login is via mobile
//     if (mobile) {
//       seller = await Seller.findOne({ mobile });
//     }

//     // Check if the login is via email
//     if (email && !seller) {
//       seller = await Seller.findOne({ email });
//     }

//     if (!seller) {
//       return res.status(404).json({
//         status: false,
//         message: 'Seller not found with the provided mobile or email',
//       });
//     }

//     // If password is provided, validate it
//     if (password) {
//       const isPasswordValid = await bcrypt.compare(password, seller.password);

//       if (!isPasswordValid) {
//         return res.status(400).json({
//           status: false,
//           message: 'Invalid password',
//         });
//       }

//       // Generate a JWT token for the seller
//       const token = jwt.sign(
//         {
//           id: seller._id,
//           mobile: seller.mobile,
//           email: seller.email,
//           role: 'seller',
//         },
//         JWT_SECRET,  // Ensure this is defined in your environment
//         { expiresIn: '6h' } // Set token expiration (optional)
//       );

//       // Return the success response with the token
//       return res.status(200).json({
//         status: true,
//         message: 'Login successful',
//         type: 'password',
//         token,
//         seller: {
//           id: seller._id,
//           name: seller.name,
//           mobile: seller.mobile,
//           email: seller.email,
//           status: seller.status,
//         },
//       });
//     }

//     return res.status(400).json({
//       status: false,
//       message: 'Please provide a password for login',
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     return res.status(500).json({
//       status: false,
//       message: 'Internal Server Error',
//       error: error.message,
//     });
//   }
// };

// GET /sellers/me

const emailPasswordLoginSeller = async (req, res) => {
  try {
    const { mobile, email, password } = req.body;

    if (!mobile && !email) {
      return res.status(400).json({
        status: false,
        message: 'Mobile number or email is required',
      });
    }

    let seller;

    // Check if the login is via mobile
    if (mobile) {
      seller = await Seller.findOne({ mobile });
    }

    // Check if the login is via email (only if not found by mobile)
    if (email && !seller) {
      seller = await Seller.findOne({ email });
    }

    if (!seller) {
      return res.status(404).json({
        status: false,
        message: 'Seller not found with the provided mobile or email',
      });
    }

    // Check the seller's status like in verifyOtpSeller
    switch (seller.status) {
      case "inactive":
        return res.status(403).json({
          status: false,
          message: "Your account is under review. Please wait for admin approval.",
        });
      case "blocked":
        return res.status(403).json({
          status: false,
          message: "Your account has been blocked. Please contact support.",
        });
      case "active":
        // proceed further below
        break;
      default:
        return res.status(500).json({
          status: false,
          message: "Unexpected account status. Please contact support.",
        });
    }

    // If password is provided, validate it
    if (password) {
      const isPasswordValid = await bcrypt.compare(password, seller.password);

      if (!isPasswordValid) {
        return res.status(400).json({
          status: false,
          message: 'Invalid password',
        });
      }

      // Generate a JWT token for the seller
      const token = jwt.sign(
        {
          id: seller._id,
          mobile: seller.mobile,
          email: seller.email,
          role: 'seller',
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Return the success response with the token
      return res.status(200).json({
        status: true,
        message: 'Login successful',
        type: 'password',
        token,
        seller: {
          id: seller._id,
          name: seller.name,
          mobile: seller.mobile,
          email: seller.email,
          status: seller.status,
        },
      });
    }

    return res.status(400).json({
      status: false,
      message: 'Please provide a password for login',
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

const getMySellerProfile = async (req, res) => {
  try {
    const sellerId = req.user?.id || req.seller?.id;

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

const changeSellerPassword = async (req, res) => {
  try {
    const sellerId = req.user.id; // 👈 ID from auth middleware
    const { oldPassword, newPassword } = req.body;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ status: false, message: 'Seller not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, seller.password);
    if (!isMatch) {
      return res.status(400).json({ status: false, message: 'Old password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    seller.password = hashedNewPassword;
    await seller.save();

    res.status(200).json({ status: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error', error: error.message });
  }
};

// Export all controller methods
module.exports = {
  getMySellerProfile,
  updateMySellerProfile,
  otpLoginSeller,
  emailPasswordLoginSeller,
  changeSellerPassword,
};
