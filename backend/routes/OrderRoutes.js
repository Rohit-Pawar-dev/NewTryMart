const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrderById,
} = require("../controllers/AdminsController/OrderController");
const {
  placeOrder,
} = require("../controllers/usersController/OrderController");

const {
  getTransactions,
} = require("../controllers/AdminsController/OrderController");
// const authenticateUser = require("../middlewares/authenticateUser");

// frontend routes
router.post("/place", placeOrder);

// backend routes
router.get("/", getOrders);
router.get("/transactions", getTransactions);
router.get("/:id", getOrderById);

module.exports = router;
