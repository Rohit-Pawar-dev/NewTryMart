const express = require("express");
const router = express.Router();
const {
  placeOrder,
  getOrders,
  getOrderById,
} = require("../controllers/OrderController");

// const authenticateUser = require("../middlewares/authenticateUser");

// frontend routes
router.post("/place", placeOrder);

// backend routes
router.get("/", getOrders);
router.get("/:id", getOrderById);

module.exports = router;
