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
    order_id: { type: Number, required: true, unique: true },
    total_price: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Returned",
        "Cancelled"
      ],
      default: "Pending",
    },
    payment_status: {
      type: String,
      enum: ["Unpaid", "Paid", "Refunded"],
      default: "Unpaid",
    },
    payment_method: {
      type: String,
      // enum: ["COD", "Online"],
      default: "COD",
    },
    admin_commission: { type: Number, default: 0 },
    coupon_code: { type: String, default: null },
    coupon_amount: { type: Number, default: 0 },
    shipping_cost: { type: Number, default: 0 },
    delivery_charge: { type: Number, default: 0 },
    transaction_id: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
