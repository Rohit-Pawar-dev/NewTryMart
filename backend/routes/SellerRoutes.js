const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const getCustomMulter = require('../utils/customMulter');
const uploadProfile = getCustomMulter('sellers/profile');
const uploadLogo = getCustomMulter('sellers/logo');
const { auth, sellerOnly } = require("../middleware/auth");
const sellerController = require("../controllers/AdminsController/sellerController");
const bankInfoController = require("../controllers/sellersController/bankInfoController");
const {
  registerSeller,
} = require("../controllers/sellersController/Auth/SignupController");
const {
  loginSeller,
  getMySellerProfile,
  updateMySellerProfile,
} = require("../controllers/sellersController/Auth/LoginController");
const {
  verifyOtpSeller,
} = require("../controllers/sellersController/Auth/VerifyController");
// Routes



router.get("/view", auth, sellerOnly, getMySellerProfile);
router.put("/edit", auth, sellerOnly, uploadProfile.single('profile_image'), updateMySellerProfile);

//this is admin routes to manage sellers
router.post("/", sellerController.createSeller);
router.get("/", sellerController.getAllSellers);
router.get("/:id", sellerController.getSellerById);
router.put("/:id", sellerController.updateSeller);
router.delete("/:id", sellerController.deleteSeller);

// router.post("/upload-logo", upload.single("logo"), sellerController.uploadLogo);

// Upload profile image
router.post('/upload/profile', uploadProfile.single('profile_image'), sellerController.uploadSellerProfileImage);

// Upload logo
router.post('/upload/logo', uploadLogo.single('logo'), sellerController.uploadSellerLogo);
// AUTH Routes

// Single file upload with field name 'logo'
router.post("/register", upload.single("logo"), registerSeller);



router.post("/login", loginSeller);

router.post("/verify-otp", verifyOtpSeller);

// Get a single bank account by ID
router.get("/bank-info/details", auth, sellerOnly, bankInfoController.getBankInfo);

// Update bank info
router.put("/bank-info/details", auth, sellerOnly, bankInfoController.editBankInfo);
// GET /sellers/me





module.exports = router;
