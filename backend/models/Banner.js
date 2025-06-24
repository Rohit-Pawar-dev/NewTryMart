const mongoose = require("mongoose");
const { Schema } = mongoose;

const bannerSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      // required: true
    },
    video: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    banner_type: {
      type: String,
      enum: [
        "main_banner",
        "popup_banner",
        "ads_img_banner",
        "ads_video_banner",
      ],
      default: "main",
    },
    start_date: {
      type: Date,
      default: null,
    },
    end_date: {
      type: Date,
      default: null,
    },
    pop_up_time: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Banner", bannerSchema);
