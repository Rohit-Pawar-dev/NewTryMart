const express = require("express");
const router = express.Router();
const CartController = require("../controllers/usersController/cartController");
const auth = require("../middleware/authMiddleware");

router.get("/cart", auth, CartController.getCart);
router.get("/cart/items", auth, CartController.cartCount);
router.post("/cart/add", auth, CartController.addToCart);
router.post("/cart/remove", auth, CartController.removeFromCart);
router.post("/cart/update", auth, CartController.updateQuantity);
router.delete("/cart/clear", auth, CartController.clearCart);
router.post("/cart/increase", auth, CartController.increaseQuantity);
router.post("/cart/decrease", auth, CartController.decreaseQuantity);
router.post("/cart/save-for-later", auth, CartController.toggleSaveForLater);
router.get("/cart/saved", auth, CartController.getSavedForLater);
router.post("/cart/move-to-cart", auth, CartController.toggleMoveToCart);

module.exports = router;
