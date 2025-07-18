const express = require("express");
const router = express.Router();

// Controllers
const adminController = require("../controllers/AdminsController/Auth/authController");
const businessSetupController = require("../controllers/AdminsController/bussinessController");

const attributeController = require("../controllers/AdminsController/attributeController");

// Utilities
const getCustomMulter = require("../utils/customMulter");
const uploadAdminProfile = getCustomMulter("admin");     // For admin profile images
const uploadLogo = getCustomMulter("logos");             // For business logos

/** ------------------- Admin Routes ------------------- **/

router.post("/admin", uploadAdminProfile.single("image"), adminController.createAdmin);
router.post("/admin/login", adminController.loginAdmin);
router.get("/admin/edit/:id", adminController.getAdmin);
router.put("/admin/update/:id", uploadAdminProfile.single("image"), adminController.updateAdmin);
router.put("/admin/change-password/:id", adminController.changePassword);

/** --------------- Business Setup Routes --------------- **/

router.get("/admin/setting/business-setup", businessSetupController.getBusinessSetup);
router.post("/admin/setting/business-setup", businessSetupController.createBusinessSetup);
router.put("/admin/setting/business-setup", businessSetupController.updateBusinessSetup);
router.post("/upload-logo", uploadLogo.single("logo"), businessSetupController.uploadLogo);


/** ----------------- Attribute Routes ------------------- **/

router.post("/attributes/add", attributeController.createAttribute);
router.get("/attributes/view", attributeController.getAllAttributes);
router.get("/attributes/view-by-type", attributeController.getAttributesByType); // ?type=color or ?type=size
router.delete("/attributes/delete/:id", attributeController.deleteAttribute);

module.exports = router;
