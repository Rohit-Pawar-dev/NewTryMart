const mongoose = require("mongoose");
const { Schema } = mongoose;

const sellerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: 3,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: "male",
    },
    mobile: {
      type: String,
      required: [true, "Mobile is required"],
      unique: true,
      minlength: 10,
      maxlength: 10,
    },
    email: {
      type: String,
      default: "",
    },
    otp: {
      type: String,
      // required: true,
      default: "0000",
    },
    shop_name: {
      type: String,
      required: [true, "Shop name is required"],
    },
    address: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    pincode: {
      type: String,
      default: "",
    },
    business_category: {
      type: String,
      // required: [true, 'Business category is required']
    },

    // 🧾 GST-related fields
    gst_number: {
      type: String,
      default: "",
    },
    gst_registration_type: {
      type: String,
      enum: ["Regular", "Composition", "Unregistered", "Exempted"],
      default: "Unregistered",
    },
    gst_verified: {
      type: Boolean,
      default: false,
    },

    profile_image: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "inactive",
      enum: ["active", "inactive", "blocked"],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Seller", sellerSchema);
