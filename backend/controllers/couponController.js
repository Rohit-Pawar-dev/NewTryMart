const Coupon = require('../models/Coupon');

function generateCouponCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for(let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// CREATE a new coupon
exports.createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({
      status: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

// GET all coupons (with pagination and optional search on couponTitle)
exports.getCoupons = async (req, res) => {
  try {
    const { search = '', all = 'false' } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // filter to search couponTitle, and optionally filter active coupons only
    const filter = {
      ...(all === 'true' ? {} : { expireDate: { $gte: new Date() } }), // example filter: only non-expired coupons if all != true
      couponTitle: { $regex: search, $options: 'i' }
    };

    const total = await Coupon.countDocuments(filter);

    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    res.json({
      status: true,
      message: 'Coupons fetched successfully',
      data: coupons,
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// GET coupon by ID
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ status: false, message: 'Coupon not found' });
    }
    res.json({
      status: true,
      message: 'Coupon fetched successfully',
      data: coupon
    });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// UPDATE coupon by ID
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) {
      return res.status(404).json({ status: false, message: 'Coupon not found' });
    }
    res.json({
      status: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

// DELETE coupon by ID
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ status: false, message: 'Coupon not found' });
    }
    res.json({
      status: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// GENERATE coupon code
exports.generateCouponCode = (req, res) => {
  const code = generateCouponCode(8);
  res.json({
    status: true,
    message: 'Coupon code generated successfully',
    data: { couponCode: code }
  });
};

exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode, totalAmount } = req.body;

    if (!couponCode || typeof totalAmount !== 'number') {
      return res.status(400).json({
        status: false,
        message: 'couponCode and totalAmount are required'
      });
    }

    // Find coupon by code (case-insensitive)
    const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: 'Invalid coupon code'
      });
    }

    const now = new Date();

    // Check if coupon status is active
    if (coupon.status !== 'active') {
      return res.status(400).json({
        status: false,
        message: 'Coupon is inactive'
      });
    }

    // Check if coupon is within valid date range
    if (coupon.startDate > now) {
      return res.status(400).json({
        status: false,
        message: 'Coupon is not active yet'
      });
    }

    if (coupon.expireDate < now) {
      return res.status(400).json({
        status: false,
        message: 'Coupon has expired'
      });
    }

    // Check minimum purchase
    if (totalAmount < coupon.minimumPurchase) {
      return res.status(400).json({
        status: false,
        message: `Minimum purchase amount for this coupon is ${coupon.minimumPurchase}`
      });
    }

    // Calculate discount
    let discountValue = 0;
    if (coupon.discountType === 'percentage') {
      discountValue = (totalAmount * coupon.discountAmount) / 100;
    } else if (coupon.discountType === 'fixed') {
      discountValue = coupon.discountAmount;
    }

    // Ensure discount does not exceed purchase amount
    if (discountValue > totalAmount) discountValue = totalAmount;

    const finalAmount = totalAmount - discountValue;

    res.json({
      status: true,
      message: 'Coupon applied successfully',
      data: {
        couponCode: coupon.couponCode,
        discountType: coupon.discountType,
        discountAmount: coupon.discountAmount,
        discountValue,
        originalAmount: totalAmount,
        finalAmount
      }
    });
  } catch (error) {
    console.error('Coupon apply error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

