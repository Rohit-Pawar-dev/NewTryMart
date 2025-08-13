const bcrypt = require('bcrypt');
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
      logo,
      profile_image,
      pincode,
      business_category,
      gst_number,
      gst_registration_type,
      gst_verified,
      password,
    } = req.body;

    // Basic required fields check (password is optional)
    if (!name || !mobile || !shop_name || !business_category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for existing mobile or email
    const existingSeller = await Seller.findOne({
      $or: [{ mobile }, { email }],
    });

    if (existingSeller) {
      if (existingSeller.mobile === mobile) {
        return res.status(409).json({ message: 'Mobile number already registered' });
      }
      if (existingSeller.email && existingSeller.email === email) {
        return res.status(409).json({ message: 'Email already registered' });
      }
    }

    // Hash the password only if provided
    let hashedPassword = '';
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create seller document
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
      profile_image,
      status: 'inactive',
      password: hashedPassword || undefined, // Store only if provided
    });

    const savedSeller = await newSeller.save();

    res.status(201).json({
      message: 'Seller registered successfully. Please wait for admin approval.',
      seller: {
        id: savedSeller._id,
        name: savedSeller.name,
        shop_name: savedSeller.shop_name,
        mobile: savedSeller.mobile,
        email: savedSeller.email,
        status: savedSeller.status,
        logo: savedSeller.logo,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = {
  registerSeller,
};
