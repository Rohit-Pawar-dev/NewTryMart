const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");



// Frontend
router.get("/all", productController.getActiveProducts);
router.get("/top-products", productController.getTopProducts);
router.get("/new-products", productController.getNewProducts);
router.get("/category/:category_id", productController.getProductsByCategory);
router.get("/subcategory/:sub_category_id", productController.getProductsBySubCategory);
router.get("/details/:id", productController.getProductDetails);


// Admin
router.post("/", productController.createProduct);
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
