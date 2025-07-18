const express = require("express");
const router = express.Router();


const wishlistController = require("../controllers/usersController/wishlistController");


// Add item to wishlist
router.post("/add", wishlistController.addToWishlist);

// Get user's wishlist
router.get("/view", wishlistController.getWishlist);

// Remove item from wishlist
router.delete("/remove/:itemId", wishlistController.removeFromWishlist);

// Export the router
module.exports = router;
