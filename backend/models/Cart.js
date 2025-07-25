const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: false,
      default: 1,
      min: 1,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VariantOption",
      default: null,
    },
    is_variant: {
      type: Boolean,
      default: false,
    },
    selected_variant: {
      type: Map,
      of: String,
      default: null,
    },
    total_price: {
      type: Number,
      required: true,
    },
    unit_price: {
      type: Number,
      required: true,
    },
    save_for_later: {
      type: Boolean,
      default: false,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      required: false,
      default: 0,
    },
    coupon_amount: {
      type: Number,
      required: false,
      default: 0,
    },
    coupon_code: {
      type: String,
    },
    discount_type: { type: String, enum: ["flat", "percent"], default: "flat" },
    tax_model: {
      type: String,
    },
    slug: String,
    name: {
      type: String,
      required: true,
    },
    thumbnail: String,
    seller_id: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
    },
    seller_is: {
      type: String,
      enum: ["admin", "seller"],
      required: true,
      default: "admin",
    },
    shipping_cost: {
      type: Number,
      required: true,
      default: 0,
    },
     variant_key: {
      type: String,
      required: true, // required to ensure unique index always works
      index: true,
    },

    shipping_type: String,
  },
  
  {
    timestamps: true,
  }
);
// cartSchema.index({ customer_id: 1, product_id: 1, variant_id: 1 }, { unique: true });

cartSchema.index({ customer_id: 1, variant_key: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);
