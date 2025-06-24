const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const userController = require("../controllers/AdminsController/userController");
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
} = require("../controllers/usersController/OrderController");

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
router.post("/update-profile", auth, userController.updateProfile);
router.get("/profile", auth, userController.getProfile);

router.post("/place-order-online", auth, placeOrderOnline);
module.exports = router;
