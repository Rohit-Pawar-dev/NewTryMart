const express = require("express");
const router = express.Router();
const couponController = require("../controllers/AdminsController/couponController");

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

router.post("/apply", couponController.applyCoupon);
router.delete("/remove-coupon/:userId", couponController.removeCoupon);

module.exports = router;
