const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../middleware/auth");

const {
  getOrders,
  getOrderById,
  getTransactions,
  changePaymentStatus,
  changeOrderStatus,
} = require("../controllers/AdminsController/OrderController");
const {
  placeOrder
} = require("../controllers/usersController/OrderController");

// frontend routes
router.post("/place", placeOrder);

// backend routes
router.get("/", getOrders);
router.get("/transactions", getTransactions);
router.get("/:id", getOrderById);
router.post("/:orderId/paymentStatus", auth, adminOnly, changePaymentStatus);
router.post("/:orderId/status", auth, adminOnly, changeOrderStatus);

module.exports = router;
