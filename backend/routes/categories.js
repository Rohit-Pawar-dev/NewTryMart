const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/AdminsController/categoryController");
const getCustomMulter = require('./../utils/customMulter');

const uploadCategory = getCustomMulter('categories');


// Create
router.post("/", categoryController.createCategory);

// Read All (with optional filters)
router.get("/", categoryController.getAllCategories);

// Read One
router.get("/:id", categoryController.getCategoryById);

// Update
router.put("/:id", categoryController.updateCategory);

// Delete
router.delete("/:id", categoryController.deleteCategory);

router.post('/upload-image', uploadCategory.single('image'), categoryController.uploadCategoryImage);

module.exports = router;
