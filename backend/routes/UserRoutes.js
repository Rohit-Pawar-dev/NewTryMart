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
const uploadUserProfile = getCustomMulter('user');
const walletController = require("../controllers/usersController/walletController");
const optionalAuth = require("../middleware/optionalAuth");
const returnRequestController = require("../controllers/usersController/ReturnRequestController");
const uploadReturn = getCustomMulter('return_requests');
const authController = require("../controllers/usersController/authController");

// product routes
router.get("/products/offers_for_you", optionalAuth, productController.offersForYou);
router.get("/products/trending", optionalAuth, productController.trendingProducts);

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
router.post('/upload-profilePicture', uploadUserProfile.single('profilePicture'), userController.uploadProfileImage);
router.post("/update-profile", auth, userController.updateProfile);
router.get("/profile", auth, userController.getProfile);
router.post("/place-order-online", auth, placeOrderOnline);

// Wallet payment order
router.post("/place-order-wallet", auth, placeOrderFromWallet);

/** ------------------ Wishlist Routes ------------------- **/
router.post("/wishlist/add", auth, wishlistController.addToWishlist);
router.get("/wishlist/view", auth, wishlistController.getWishlist);
router.delete("/wishlist/remove/:itemId", auth, wishlistController.removeFromWishlist);

/**---------------------Wallet Routes-------------------- */
router.post("/wallet/debit", auth, walletController.debitMoneyFromWallet);

// Get wallet balance
router.get("/wallet/balance", auth, walletController.getWalletBalance);

// Add monet to wallet
router.post("/wallet/credit", auth, walletController.addMoneyToWallet);


// Get all wallet transactions
router.get("/wallet/transactions", auth, walletController.getWalletTransactions);

//Get delivery Charges
router.get("/business-setup/deliveryCharges", bussinessController.deliveryCharges);
router.get("/business-setup/seller-commission", bussinessController.getSellerCommoision);

// Create a return request
router.post("/return-requests", auth, returnRequestController.createReturnRequest);

// Cancel order
router.put("/cancel/:orderId", auth, returnRequestController.cancelOrder);

// Get return request by order ID
router.get("/return-requests/:order_id", auth, returnRequestController.getReturnRequestByOrder);

// Upload a single proof image
router.post("/return-requests/upload", auth, uploadReturn.single('image'), returnRequestController.uploadReturnImage);


//paymentmethod get
router.get("/business-setup/payment-methods", authController.getPaymentOptions);

module.exports = router;
