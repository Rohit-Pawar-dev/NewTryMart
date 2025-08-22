const express = require("express");
const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
} = require("../controllers/paymentController");
const auth = require("../middleware/authMiddleware");

// Protect the route with auth middleware
router.post("/create-order", auth, createRazorpayOrder);

router.post("/verify", verifyRazorpaySignature);

module.exports = router;
