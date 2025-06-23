const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    order_items: [
      {
        type: Schema.Types.ObjectId,
        ref: "OrderItemDetail",
        required: true,
      },
    ],
    shipping_address: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },

    total_price: { type: Number, required: true },

    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    payment_status: {
      type: String,
      enum: ["Unpaid", "Paid", "Refunded"],
      default: "Unpaid",
    },

    payment_method: {
      type: String,
      enum: ["COD", "Online"],
      default: "COD",
    },
    coupon_code: { type: String, default: null },
    coupon_amount: { type: Number, default: 0 },
    shipping_cost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
