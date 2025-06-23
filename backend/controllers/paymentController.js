const Razorpay = require("razorpay");
const crypto = require("crypto");
const Product = require("../models/Product");
const VariantOption = require("../models/VariantOption");
const Cart = require("../models/Cart");
const User = require("../models/User");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 * Expects: { amount: number }
 */

const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("Creating Razorpay order for user:", userId);

    const cartItems = await Cart.find({
      customer_id: userId,
      save_for_later: false,
    });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Cart is empty",
      });
    }

    let totalAmount = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let couponAmount = 0;

    for (const item of cartItems) {
      let basePrice = 0,
        discountAmount = 0,
        taxAmount = 0;
      let product = await Product.findById(item.product_id);
      if (!product) continue;

      if (item.is_variant && item.variant_id) {
        const variant = await VariantOption.findOne({
          _id: item.variant_id,
          product_id: item.product_id,
        });
        if (!variant) continue;
        basePrice = variant.price;
      } else {
        basePrice = product.unit_price;
      }

      // Discount
      if (product.discount_type === "percent") {
        discountAmount = (product.discount / 100) * basePrice;
      } else {
        discountAmount = product.discount;
      }
      discountAmount = Math.min(discountAmount, basePrice);
      const priceAfterDiscount = basePrice - discountAmount;

      // Tax
      taxAmount = (product.tax / 100) * priceAfterDiscount;
      const finalPrice = priceAfterDiscount + taxAmount;

      totalDiscount += discountAmount * item.quantity;
      totalTax += taxAmount * item.quantity;
      totalAmount += finalPrice * item.quantity;

      // Coupon
      if (item.coupon_code && item.coupon_amount && couponAmount === 0) {
        couponAmount = item.coupon_amount;
      }
    }

    const finalTotal = Math.max(0, totalAmount - couponAmount);

    if (finalTotal <= 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid total amount",
      });
    }

    // Create Razorpay Order
    const options = {
      amount: Math.round(finalTotal * 100), // paise
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(201).json({
      status: true,
      message: "Order created successfully",
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        created_at: order.created_at,
      },
    });
  } catch (error) {
    console.error("🔥 Razorpay Order Error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
};

/**
 * Verify Razorpay signature
 * Expects: {
 *   razorpay_order_id,
 *   razorpay_payment_id,
 *   razorpay_signature
 * }
 */
const verifyRazorpaySignature = (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: false,
        message: "Missing payment verification fields",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = generatedSignature === razorpay_signature;

    if (isValid) {
      return res.json({
        status: true,
        message: "Payment verified successfully",
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Invalid payment signature",
      });
    }
  } catch (error) {
    console.error("🔥 Razorpay Verify Error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
};
