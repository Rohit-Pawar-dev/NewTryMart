const express = require("express");
const router = express.Router();
const couponController = require("../controllers/AdminsController/couponController");
const auth = require("../middleware/authMiddleware");

// GENERATE coupon code (place before :id to avoid conflict)
router.get("/generate/code", couponController.generateCouponCode);

// CREATE a new coupon
router.post("/", couponController.createCoupon);

// GET all coupons
router.get("/", couponController.getCoupons);

// GET coupon by ID
router.get("/:id", couponController.getCouponById);

// UPDATE coupon by ID
router.put("/:id", couponController.updateCoupon);

// DELETE coupon by ID
router.delete("/:id", couponController.deleteCoupon);

// APPLY coupon

router.post("/apply", auth, couponController.applyCoupon);
router.post("/remove-coupon", auth, couponController.removeCoupon);

module.exports = router;
