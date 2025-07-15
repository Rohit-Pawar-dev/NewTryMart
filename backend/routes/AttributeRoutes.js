const express = require("express");
const router = express.Router();
const attributeController = require("../controllers/AdminsController/attributeController");

// Create Attribute
router.post("/add", attributeController.createAttribute);

// Get All Attributes
router.get("/view", attributeController.getAllAttributes);

// Get Attributes by Type (use query param: ?type=color or ?type=size)
router.get("/view-by-type", attributeController.getAttributesByType);

// Delete Attribute
router.delete("/delete/:id", attributeController.deleteAttribute);

module.exports = router;
