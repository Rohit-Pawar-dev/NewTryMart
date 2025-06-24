const express = require("express");
const router = express.Router();
const productController = require("../controllers/AdminsController/productController");
const UserProductController = require("../controllers/usersController/ProductController");

// Frontend
router.get("/all", UserProductController.getActiveProducts);
router.get("/top-products", UserProductController.getTopProducts);
router.get("/new-products", UserProductController.getNewProducts);
router.get(
  "/category/:category_id",
  UserProductController.getProductsByCategory
);
router.get(
  "/subcategory/:sub_category_id",
  UserProductController.getProductsBySubCategory
);
router.get("/details/:id", UserProductController.getProductDetails);

// Admin
router.post("/", productController.createProduct);
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
