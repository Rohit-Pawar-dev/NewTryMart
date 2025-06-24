const mongoose = require("mongoose");
const { Schema } = mongoose;

const variantOptionSchema = new Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant_values: {
      type: Map,
      of: String, // e.g., { "Size": "M", "Color": "Red" }
      required: true,
    },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    images: [String],
    sku: { type: String, unique: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("VariantOption", variantOptionSchema);
