const Seller = require('../../../models/Seller');

const registerSeller = async (req, res) => {
  try {
    const {
      name,
      gender,
      mobile,
      email,
      shop_name,
      address,
      country,
      state,
      city,
      pincode,
      business_category,
      gst_number,
      gst_registration_type,
      gst_verified,
      status
    } = req.body;

    // Handle uploaded logo
    const logo = req.file ? req.file.path : '';

    // Basic required fields check (OTP removed)
    if (!name || !mobile || !shop_name || !business_category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for existing mobile
    const existingSeller = await Seller.findOne({ mobile });
    if (existingSeller) {
      return res.status(409).json({ message: 'Mobile number already registered' });
    }

    // Create seller document (otp will be set to default '0000' in schema)
    const newSeller = new Seller({
      name,
      gender,
      mobile,
      email,
      shop_name,
      address,
      country,
      state,
      city,
      pincode,
      business_category,
      gst_number,
      gst_registration_type,
      gst_verified,
      logo,
      status
    });

    const savedSeller = await newSeller.save();

    res.status(201).json({ message: 'Seller registered successfully', seller: savedSeller });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = {
  registerSeller
};
