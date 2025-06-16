const express = require("express");
const router = express.Router();
const { placeOrder } = require("../controllers/placeOrderController"); 


// const authenticateUser = require("../middlewares/authenticateUser");

router.post("/place", placeOrder);

module.exports = router;
