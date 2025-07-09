const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const sellerController = require("../controllers/AdminsController/sellerController");
const {
  registerSeller,
} = require("../controllers/sellersController/Auth/SignupController");
const {
  loginSeller,
} = require("../controllers/sellersController/Auth/LoginController");
const {
  verifyOtpSeller,
} = require("../controllers/sellersController/Auth/VerifyController");
// Routes
router.post("/", sellerController.createSeller);
router.get("/", sellerController.getAllSellers);
router.get("/:id", sellerController.getSellerById);
router.put("/:id", sellerController.updateSeller);
router.delete("/:id", sellerController.deleteSeller);
router.post("/upload-logo", upload.single("logo"), sellerController.uploadLogo);

// AUTH Routes

// Single file upload with field name 'logo'
router.post("/register", upload.single("logo"), registerSeller);
router.post("/login", loginSeller);
router.post("/verify-otp", verifyOtpSeller);
module.exports = router;

module.exports = router;
