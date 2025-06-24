const express = require("express");
const router = express.Router();
const CartController = require("../controllers/usersController/cartController");

router.get("/cart/:userId", CartController.getCart);
router.post("/cart/add", CartController.addToCart);
router.post("/cart/remove", CartController.removeFromCart);
router.post("/cart/update", CartController.updateQuantity);
router.delete("/cart/clear/:userId", CartController.clearCart);
router.post("/cart/increase", CartController.increaseQuantity);
router.post("/cart/decrease", CartController.decreaseQuantity);
router.post("/cart/save-for-later", CartController.toggleSaveForLater);
router.get("/cart/saved/:userId", CartController.getSavedForLater);
router.post("/cart/move-to-cart", CartController.toggleMoveToCart);

module.exports = router;
