const express = require("express");
const router = express.Router();
const businessCategoryController = require('../controllers/AdminsController/bussinessCategoriesController');
// Controllers
const adminController = require("../controllers/AdminsController/Auth/authController");
const businessSetupController = require("../controllers/AdminsController/bussinessController");

const attributeController = require("../controllers/AdminsController/attributeController");
const { auth, adminOnly } = require("../middleware/auth");


// Utilities
const getCustomMulter = require("../utils/customMulter");
const uploadAdminProfile = getCustomMulter("admin");    
const uploadLogo = getCustomMulter("logos");             
/** ------------------- Admin Routes ------------------- **/

router.post("/admin", uploadAdminProfile.single("image"), adminController.createAdmin);
router.post("/admin/login", adminController.loginAdmin);
router.get("/admin/edit/:id", adminController.getAdmin);
router.put("/admin/update/:id",auth ,adminOnly, uploadAdminProfile.single("image"), adminController.updateAdmin);
router.put("/admin/change-password/:id",auth , adminOnly, adminController.changePassword);

/** --------------- Business Setup Routes --------------- **/

router.get("/admin/setting/business-setup", businessSetupController.getBusinessSetup);
router.post("/admin/setting/business-setup", businessSetupController.createBusinessSetup);
router.put("/admin/setting/business-setup",auth , adminOnly, businessSetupController.updateBusinessSetup);
router.post("/upload-logo", uploadLogo.single("logo"), businessSetupController.uploadLogo);


/** ----------------- Attribute Routes ------------------- **/

router.post("/attributes/add", attributeController.createAttribute);
router.get("/attributes/view", attributeController.getAllAttributes);
router.get("/attributes/view-by-type", attributeController.getAttributesByType); 
router.delete("/attributes/delete/:id", attributeController.deleteAttribute);


router.get('/business-categories', businessCategoryController.getAllCategories);
router.post('/business-categories', businessCategoryController.createCategory);
router.put('/business-categories/:id', businessCategoryController.updateCategory);
router.delete('/business-categories/:id', businessCategoryController.deleteCategory);


module.exports = router;
