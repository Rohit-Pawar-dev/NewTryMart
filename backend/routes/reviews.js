const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/usersController/reviewController");
const getCustomMulter = require("../utils/customMulter");

const upload = getCustomMulter('reviews');
// Routes
router.post("/", reviewController.create);
router.get("/", reviewController.getAll);
router.get("/:id", reviewController.getOne);
router.put("/:id", reviewController.update);
router.delete("/:id", reviewController.remove);
router.get('/by-order-user', reviewController.getByOrderAndUser);

router.post('/upload-image', upload.single('image'), reviewController.uploadImage);

module.exports = router;
