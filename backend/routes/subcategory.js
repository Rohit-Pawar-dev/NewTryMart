// routes/subCategoryRoutes.js
const express = require("express");
const router = express.Router();
const subCategoryController = require("../controllers/AdminsController/subCategoryController");
const getCustomMulter = require('./../utils/customMulter');

const uploadSubCategory = getCustomMulter('subcategories');

router.post("/", subCategoryController.createSubCategory);
router.get("/", subCategoryController.getAllSubCategories);
router.get("/:id", subCategoryController.getSubCategoryById);
router.put("/:id", subCategoryController.updateSubCategory);
router.delete("/:id", subCategoryController.deleteSubCategory);
router.post('/upload-image', uploadSubCategory.single('image'), subCategoryController.uploadSubCategoryImage);

module.exports = router;
