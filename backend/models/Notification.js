const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    seller_id: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
