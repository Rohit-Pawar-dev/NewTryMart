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
  emailPasswordLoginSeller,
   otpLoginSeller,
  getMySellerProfile,
  updateMySellerProfile,
} = require("../controllers/sellersController/Auth/LoginController");
const {
  verifyOtpSeller,
} = require("../controllers/sellersController/Auth/VerifyController");
// Routes



router.get("/view", auth, sellerOnly, getMySellerProfile);
router.put("/edit", auth, sellerOnly, uploadProfile.single('profile_image'), updateMySellerProfile);


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





module.exports = router;
