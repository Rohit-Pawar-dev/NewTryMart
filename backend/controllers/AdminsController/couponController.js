const Coupon = require("../../models/Coupon");
const Cart = require("../../models/Cart");
const VariantOption = require("../../models/VariantOption");
const Product = require("../../models/Product");

function generateCouponCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
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
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

// GET all coupons (with pagination and optional search on couponTitle)
exports.getCoupons = async (req, res) => {
  try {
    const { search = "", all = "false" } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // filter to search couponTitle, and optionally filter active coupons only
    const filter = {
      ...(all === "true" ? {} : { expireDate: { $gte: new Date() } }),
      couponTitle: { $regex: search, $options: "i" },
    };

    const total = await Coupon.countDocuments(filter);

    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    res.json({
      status: true,
      message: "Coupons fetched successfully",
      data: coupons,
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// GET coupon by ID
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ msg: "Coupon not found" });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
 
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!coupon) {
      return res
        .status(404)
        .json({ status: false, message: "Coupon not found" });
    }
    res.json({
      status: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res
        .status(404)
        .json({ status: false, message: "Coupon not found" });
    }
    res.json({
      status: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.generateCouponCode = (req, res) => {
  const code = generateCouponCode(8);
  res.json({
    status: true,
    message: "Coupon code generated successfully",
    data: { couponCode: code },
  });
};

(exports.applyCoupon = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { couponCode } = req.body;

    if (!couponCode || !userId) {
      return res.status(400).json({
        status: false,
        message: "couponCode and userId are required",
      });
    }

    // Fetch and validate coupon
    const coupon = await Coupon.findOne({
      couponCode: couponCode.toUpperCase(),
    });
    if (!coupon) {
      return res
        .status(404)
        .json({ status: false, message: "Invalid coupon code" });
    }

    const now = new Date();
    if (coupon.status !== "active") {
      return res
        .status(400)
        .json({ status: false, message: "Coupon is inactive" });
    }
    if (coupon.startDate > now) {
      return res
        .status(400)
        .json({ status: false, message: "Coupon is not active yet" });
    }
    if (coupon.expireDate < now) {
      return res
        .status(400)
        .json({ status: false, message: "Coupon has expired" });
    }

    // Fetch user's cart
    const cartItems = await Cart.find({
      customer_id: userId,
      save_for_later: false,
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ status: false, message: "Cart is empty" });
    }

    let totalAmount = 0;

    for (const item of cartItems) {
      const product = await Product.findById(item.product_id);
      if (!product) continue;

      let unitPrice = product.unit_price;
      let discount = product.discount || 0;

      if (item.is_variant && item.variant_id) {
        const variant = await VariantOption.findOne({
          _id: item.variant_id,
          product_id: item.product_id,
        });
        if (variant) unitPrice = variant.price;
      }

      let discountAmount = 0;
      if (product.discount_type === "percent") {
        discountAmount = (discount / 100) * unitPrice;
      } else {
        discountAmount = discount;
      }

      discountAmount = Math.min(discountAmount, unitPrice);
      const priceAfterDiscount = unitPrice - discountAmount;

      totalAmount += priceAfterDiscount * item.quantity;
    }

    // Check minimum purchase
    if (totalAmount < coupon.minimumPurchase) {
      return res.status(400).json({
        status: false,
        message: `Minimum purchase amount for this coupon is ${coupon.minimumPurchase}`,
      });
    }

    // Apply coupon discount
    let discountValue = 0;
    if (coupon.discountType === "percent") {
      discountValue = (totalAmount * coupon.discountAmount) / 100;
    } else if (coupon.discountType === "flat") {
      discountValue = coupon.discountAmount;
    }
    discountValue = Math.min(discountValue, totalAmount);
    const finalAmount = totalAmount - discountValue;

    // Save coupon info on cart items
    await Cart.updateMany(
      { customer_id: userId, save_for_later: false },
      {
        $set: {
          coupon_code: coupon.couponCode,
          coupon_amount: discountValue,
        },
      }
    );

    res.json({
      status: true,
      message: "Coupon applied successfully",
      data: {
        couponCode: coupon.couponCode,
        discountType: coupon.discountType,
        discountAmount: coupon.discountAmount,
        discountValue,
        originalAmount: totalAmount,
        finalAmount,
      },
    });
  } catch (error) {
    console.error("Coupon apply error:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}),
  (exports.removeCoupon = async (req, res) => {
    const userId = req.user?.id;
      //  console.log(userId);
    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required",
      });
    }

    try {
      // Remove coupon_code and coupon_amount from user's cart items
      await Cart.updateMany(
        { customer_id: userId, coupon_code: { $exists: true } },
        {
          $unset: {
            coupon_code: "",
            coupon_amount: "",
          },
        }
      );

      res.json({
        status: true,
        message: "Coupon removed from cart",
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  });
