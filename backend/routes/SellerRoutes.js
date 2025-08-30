const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const getCustomMulter = require('../utils/customMulter');
const uploadProfile = getCustomMulter('sellers/profile');
const uploadLogo = getCustomMulter('sellers/logo');
const { auth, sellerOnly } = require("../middleware/auth");
const sellerController = require("../controllers/AdminsController/sellerController");
const bankInfoController = require("../controllers/sellersController/bankInfoController");
const sellerDashboardController = require("../controllers/sellersController/sellerDashboard");
const walletTransactionController = require("../controllers/sellersController/walletTransactionController");
const {
  registerSeller,
} = require("../controllers/sellersController/Auth/SignupController");
const {
  emailPasswordLoginSeller,
  otpLoginSeller,
  getMySellerProfile,
  changeSellerPassword,
  updateMySellerProfile,
} = require("../controllers/sellersController/Auth/LoginController");
const {
  verifyOtpSeller,
} = require("../controllers/sellersController/Auth/VerifyController");
const getProducts = require("../controllers/sellersController/sellerProductController");
const sellerOrderController = require("../controllers/sellersController/sellerOrders");

//seller side apis 
router.get("/view", auth, sellerOnly, getMySellerProfile);
router.put("/edit", auth, sellerOnly, updateMySellerProfile);
router.post('/change-password', auth, sellerOnly, changeSellerPassword);
// Get products by seller
router.get('/products', auth, sellerOnly, getProducts.getProductsBySeller);
router.post('/products', auth, sellerOnly, getProducts.createProduct);
router.put('/products/:id', auth, sellerOnly, getProducts.updateProduct);


router.post('/products/status', auth, sellerOnly, getProducts.status_update);

// Get all orders for the authenticated seller with pagination and filters
router.get("/orders", auth, sellerOnly, sellerOrderController.getSellerOrders);

// Get a particular order by ID for the seller
router.get("/orders/:id", auth, sellerOnly, sellerOrderController.getSellerOrderById);

// Get transactions related to the authenticated seller
router.get("/transactions", auth, sellerOnly, sellerOrderController.getSellerTransactions);

router.post("/:orderId/paymentStatus", auth, sellerOnly, sellerOrderController.changePaymentStatus);
router.post("/:orderId/status", auth, sellerOnly, sellerOrderController.changeOrderStatus);

router.get("/dashboard", auth, sellerOnly, sellerDashboardController.sellerDashboard);

// router.post("/upload-logo", upload.single("logo"), sellerController.uploadLogo);

// Upload profile image
router.post('/upload/profile', uploadProfile.single('profile_image'), sellerController.uploadSellerProfileImage);

// Upload logo
router.post('/upload/logo', uploadLogo.single('logo'), sellerController.uploadSellerLogo);
// AUTH Routes

router.post("/register", registerSeller);


// OTP-based login (using mobile number)
router.post('/login/otp', otpLoginSeller);

// Email/Password-based login
router.post('/login/email-password', emailPasswordLoginSeller);

router.post("/verify-otp", verifyOtpSeller);

// Get a single bank account by ID
router.get("/bank-info/details", auth, sellerOnly, bankInfoController.getBankInfo);

// Update bank info
router.put("/bank-info/details", auth, sellerOnly, bankInfoController.editBankInfo);

//withdrawal request 
router.post("/withdrawal-request", auth, sellerOnly, bankInfoController.createRequest);
router.get("/withdrawal-requests", auth, sellerOnly, bankInfoController.listSellerRequests);
router.get("/wallet", auth, sellerOnly, bankInfoController.getWalletBalance);

// Get seller wallet transactions
router.get("/wallet/transactions", auth, sellerOnly, walletTransactionController.getSellerWalletTransactions);

module.exports = router;
