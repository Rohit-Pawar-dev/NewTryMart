const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    mobile: {
      type: String,
      required: [true, "Mobile field is required"],
      unique: true,
      minlength: 10,
      maxlength: 10,
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
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: "prefer_not_to_say",
    },
    password: {
      type: String,
      // required: true,
      minlength: 8,
    },
    role: {
      type: String,
      required: true,
      default: "user",
      enum: ["user", "seller", "admin"],
    },
    otp: {
      type: String,
      required: true,
      default: "0000",
    },
    profilePicture: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "blocked"],
    },
    fcm_id: {
      type: String,
      default: "",
    },
    wallet_amount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// 🔐 Hash password before saving (Create)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔐 Hash password before updating (Update)
userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(update.password, salt);
  }
  update.updated_at = new Date();
  this.setUpdate(update);
  next();
});

// 🔐 Compare plain and hashed passwords
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
