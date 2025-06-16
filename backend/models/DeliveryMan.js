const mongoose = require("mongoose");

const deliveryManSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    //   unique: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String, // URL or path to the photo
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    licensePhoto: {
      type: String, // URL or path to license photo
      trim: true,
    },
    identityProofPhoto: {
      type: String, // URL or path to identity proof photo
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryMan", deliveryManSchema);
