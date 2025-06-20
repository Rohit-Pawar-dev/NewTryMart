const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderItemDetailSchema = new Schema(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
   product_detail: {
      type: Schema.Types.Mixed, // Removed `ref` because we're storing snapshot
      required: true,
    },
    name: { type: String, required: true },
    thumbnail: String,
    selected_variant: {
      type: Map,
      of: String,
      default: {},
    },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    total_price: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discount_type: { type: String, enum: ["flat", "percent"], default: "flat" },
    tax_model: String,
    slug: String,

    seller_id: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      // required: true,
    },

    shipping_cost: { type: Number, default: 0 },
    shipping_type: String,

    shipping_address: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    delivery_status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    added_by: { type: String, enum: ["admin", "seller"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderItemDetail", orderItemDetailSchema);
