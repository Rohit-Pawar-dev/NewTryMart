const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/AdminsController/bannerController");
const getCustomMulter = require('./../utils/customMulter');

const uploadBanners = getCustomMulter('banners');


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

// One route to handle both image and video
router.post('/upload', uploadBanners.single('file'), bannerController.uploadBannerMedia);

module.exports = router;
