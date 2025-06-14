const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");

// Create
router.post("/", bannerController.createBanner);

// Read All
router.get("/", bannerController.getAllBanners);

// Read One
router.get("/:id", bannerController.getBannerById);

// Update
router.put("/:id", bannerController.updateBanner);

// Delete
router.delete("/:id", bannerController.deleteBanner);

module.exports = router;
