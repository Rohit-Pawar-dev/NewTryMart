const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const userController = require("../controllers/AdminsController/userController");
const bussinessController = require("../controllers/AdminsController/bussinessController")
const auth = require("../middleware/authMiddleware");
const {
  getUserOrders,
  getUserOrderById,
} = require("../controllers/usersController/OrderController");

const productController = require("../controllers/usersController/ProductController");
const sellerController = require("../controllers/usersController/SellerController");
const NotificationController = require("../controllers/usersController/NotificationController");
const {
  placeOrderOnline,
  placeOrderFromWallet,
} = require("../controllers/usersController/OrderController");
const wishlistController = require("../controllers/usersController/wishlistController");
const getCustomMulter = require('./../utils/customMulter');

const uploadSubCategory = getCustomMulter('user');
const walletController = require("../controllers/usersController/walletController");

// Routes

// product routes
router.get("/products/offers_for_you", productController.offersForYou);
router.get("/products/trending", productController.trendingProducts);

// order routes
router.get("/orders", auth, getUserOrders);
router.get("/orders/:id", auth, getUserOrderById);

// user routes
router.post("/add", userController.createUser);
router.get("/list", userController.getAllUsers);
router.get("/view/:id", userController.getUserById);
router.put("/edit/:id", userController.updateUser);
router.delete("/delete/:id", userController.deleteUser);

// seller routes
router.get("/sellers", sellerController.getAllSellers);
router.get("/sellers/details/:sellerId", sellerController.getSellerDetails);

// GET /api/notifications - get logged-in user's notifications
router.get("/notifications", auth, NotificationController.getUserNotifications);
router.get(
  "/notifications/count",
  auth,
  NotificationController.getUnreadNotificationCount
);

router.post(
  "/upload-profile",
  upload.single("profile"),
  userController.uploadProfilePicture
);

router.post('/upload-profilePicture', uploadSubCategory.single('profilePicture'),userController.uploadProfileImage);
router.post("/update-profile", auth, userController.updateProfile);


router.post

router.get("/profile", auth, userController.getProfile);

router.post("/place-order-online", auth, placeOrderOnline);

// Wallet payment order
router.post("/place-order-wallet", auth, placeOrderFromWallet);

/** ------------------ Wishlist Routes ------------------- **/

router.post("/wishlist/add", wishlistController.addToWishlist);
router.get("/wishlist/view", wishlistController.getWishlist);
router.delete("/wishlist/remove/:itemId", wishlistController.removeFromWishlist);



/**---------------------Wallet Routes-------------------- */
router.post("/wallet/:userId/debit", walletController.debitMoneyFromWallet);

// Get wallet balance
router.get("/wallet/:userId/balance", walletController.getWalletBalance);


// Add monet to wallet
router.post("/wallet/:userId/credit", walletController.addMoneyToWallet);


// Get all wallet transactions
router.get("/wallet/:userId/transactions", walletController.getWalletTransactions);


//Get delivery Charges

router.get("/business-setup/deliveryCharges", bussinessController.deliveryCharges);
router.get("/business-setup/seller-commission", bussinessController.getSellerCommoision);



module.exports = router;
