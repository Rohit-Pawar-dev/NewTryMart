const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

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

module.exports = router;
