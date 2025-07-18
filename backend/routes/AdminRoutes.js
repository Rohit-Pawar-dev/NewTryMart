const express = require("express");
const router = express.Router();
const adminController = require("../controllers/AdminsController/Auth/authController");
const businessSetupController = require("../controllers/AdminsController/bussinessController");
const getCustomMulter = require("../utils/customMulter"); // utility to configure multer
const uploadAdminProfile = getCustomMulter("admin"); // uploads/admin
const uploadLogo = getCustomMulter("logos");



// admin create and login routes
router.post("/admin", uploadAdminProfile.single("image"), adminController.createAdmin);
router.post("/admin/login", adminController.loginAdmin);
router.get("/admin/edit/:id", adminController.getAdmin);
router.put(
  "/admin/update/:id",
  uploadAdminProfile.single("image"),
  adminController.updateAdmin
);
router.put("/admin/change-password/:id", adminController.changePassword);

// bussiness setup routes
router.get(
  "/admin/setting/business-setup",
  businessSetupController.getBusinessSetup
);
router.post(
  "/admin/setting/business-setup",
  businessSetupController.createBusinessSetup
);
router.put(
  "/admin/setting/business-setup",
  businessSetupController.updateBusinessSetup
);
router.post('/upload-logo', uploadLogo.single('logo'), businessSetupController.uploadLogo);
module.exports = router;
