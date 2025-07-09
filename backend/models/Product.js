const mongoose = require("mongoose");
const { Schema } = mongoose;

const variantSchema = new Schema(
  {
    name: String, // "Size" or "Color"
    values: [String], // e.g., ["S", "M", "L"] or ["Red", "Blue"]
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      default: null,
    },

    added_by: {
      type: String,
      enum: ["admin", "seller"],
      // required: true,
    },
    name: { type: String, required: true },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    sub_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      default: null,
    },
    slug: { type: String, required: true, unique: true },
    min_qty: { type: Number, default: 1 },
    thumbnail: { type: String, required: true },
    images: [String], // array of image URLs
    unit_price: { type: Number, required: true },
    // purchase_price: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discount_type: { type: String, enum: ["flat", "percent"], default: "flat" },
    current_stock: { type: Number, default: 0 },
    description: { type: String }, // CKEditor content
    status: { type: Number, enum: [0, 1], default: 1 },
    request_status: { type: Number, enum: [0, 1, 2], default: 0 },

    sku_code: { type: String },
    unit: { type: String },
    is_offers: { type: Boolean, default: false },
    is_trending: { type: Boolean, default: false },

    variants: [variantSchema],
    variation_options: [
      {
        variant_values: {
          type: Map,
          of: String,
          required: true,
        },
        price: { type: Number, required: true },
        stock: { type: Number, default: 0 },
        images: [String],
        sku: { type: String },
      },
    ],
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Product", productSchema);
