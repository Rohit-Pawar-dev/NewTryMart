const express = require("express");
const router = express.Router();
const productController = require("../controllers/AdminsController/productController");
const UserProductController = require("../controllers/usersController/ProductController");
const getCustomMulter = require('../utils/customMulter');
const optionalAuth = require('../middleware/optionalAuth');

// Frontend
router.get("/all", UserProductController.getActiveProducts);
router.get("/top-products", UserProductController.getTopProducts);
router.get("/new-products", UserProductController.getNewProducts);
router.get(
  "/category/:category_id",
  UserProductController.getProductsByCategory
);
router.get(
  "/subcategory/:sub_category_id", optionalAuth,
  UserProductController.getProductsBySubCategory
);
router.get("/details/:id",optionalAuth, UserProductController.getProductDetails);

// Admin
router.post("/", productController.createProduct);
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);
router.post("/status-update", productController.status_update);

// New Route: Change Request Status
router.patch(
  "/change-request-status/:id",
  productController.changeProductRequestStatus
);

// Folder structure: uploads/products/thumbnails, uploads/products/images, uploads/products/variants
const uploadThumbnail = getCustomMulter('products/thumbnails');
const uploadImages = getCustomMulter('products/images');
const uploadVariants = getCustomMulter('products/variants');

// Routes
router.post('/upload-thumbnail', uploadThumbnail.single('file'), productController.uploadThumbnail);
router.post('/upload-image', uploadImages.single('file'), productController.uploadProductImage);
router.post('/upload-variant-image', uploadVariants.single('file'), productController.uploadVariantImage);


module.exports = router;
