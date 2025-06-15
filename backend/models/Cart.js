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
    selected_variant: {
      type: Map,
      of: String,
      default: {},
    },
    price: {
      type: Number,
      required: true,
    },
    mrp: {
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
    added_by: {
      type: String,
      enum: ["admin", "seller"],
      required: true,
    },
    shipping_cost: {
      type: Number,
      required: true,
      default: 0,
    },
    shipping_type: String,
  },
  {
    timestamps: true,
  }
);
cartSchema.index(
  { customer_id: 1, product_id: 1, selected_variant: 1 },
  { unique: true }
);

module.exports = mongoose.model("Cart", cartSchema);
