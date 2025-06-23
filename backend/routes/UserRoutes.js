const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");
const {
  getUserOrders,
  getUserOrderById,
} = require("../controllers/usersController/OrderController");
const productController = require("../controllers/usersController/ProductController");
const sellerController = require("../controllers/usersController/SellerController");
const NotificationController = require("../controllers/usersController/NotificationController");

// Routes

// product routes
router.get("/products/offers_for_you", productController.offersForYou);
router.get("/products/trending", productController.trendingProducts);

// order routes
router.get("/orders", auth, getUserOrders);
router.get("/orders/:id", auth, getUserOrderById);

// user routes

// router.post('/', userController.createUser);
// router.get('/', userController.getAllUsers);
// router.get('/:id', userController.getUserById);
// router.put('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser);
router.post("/add", userController.createUser); // POST    /api/users/add
router.get("/list", userController.getAllUsers); // GET     /api/users/list
router.get("/view/:id", userController.getUserById); // GET     /api/users/view/:id
router.put("/edit/:id", userController.updateUser); // PUT     /api/users/edit/:id
router.delete("/delete/:id", userController.deleteUser); // DELETE  /api/users/delete/:id

// seller routes
router.get("/sellers", sellerController.getAllSellers);
router.get("/sellers/details/:sellerId", sellerController.getSellerDetails);

// GET /api/notifications - get logged-in user's notifications
router.get("/notifications", auth, NotificationController.getUserNotifications);

router.post(
  "/upload-profile",
  upload.single("profile"),
  userController.uploadProfilePicture
);
router.post("/update-profile", auth, userController.updateProfile);
router.get("/profile", auth, userController.getProfile);

module.exports = router;
