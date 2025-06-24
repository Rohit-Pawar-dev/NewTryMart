const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Create
// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(email);

    // Find user
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password1" });

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password2" });

    // Generate token
    // console.log(user);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    var post = req.body;
    const user = await User.create(post);

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res
      .status(201)
      .json({ status: true, message: "User Registered succesfully", token });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message, token: "" });
  }
});

router.post("/send-otp", async (req, res) => {
  try {
    const { mobile } = req.body;

    // Generate 4-digit OTP
    let otp = Math.floor(1000 + Math.random() * 9000);

    // Check if user exists
    const user = await User.findOne({ mobile });

    if (user) {
      // Update OTP in user record
      await User.findByIdAndUpdate(user._id, { otp });

      return res.json({
        status: true,
        otp: otp.toString(),
        type: "login",
        message: "OTP sent to registered mobile number",
      });
    } else {
      // Optionally store OTP in a temporary store (e.g., Redis or session) if needed

      return res.json({
        status: true,
        otp: otp.toString(),
        type: "signup",
        message: "OTP sent to mobile number",
      });
    }
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, otp, fcm_id } = req.body;

    // Check if user exists
    let user = await User.findOne({ mobile });
    let type = "login"; // default to login

    if (user) {
      // Validate OTP
      if (otp != user.otp) {
        return res.status(400).json({ status: false, message: "Invalid OTP" });
      }

      // Update fcm_id for existing user
      user.fcm_id = fcm_id;
      await user.save();
    } else {
      // Create user if not exists (signup)
      user = await User.create({ mobile, fcm_id });
      type = "signup";
      // Optional: validate OTP here if stored somewhere temporarily
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const profileIncomplete = !user.name || user.name.trim() === "";

    return res.json({
      status: true,
      message: "OTP verified successfully",
      type, // <-- add this line
      token,
      profileIncomplete,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

module.exports = router;
