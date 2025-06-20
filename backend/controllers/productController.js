const Product = require("../models/Product");
const VariantOption = require("../models/VariantOption");
const Review = require("../models/Review");
// Create Product
function generateSkuCode(name) {
  const cleanName = name.toLowerCase().replace(/\s+/g, "-").substring(0, 10);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4-char random
  const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit number
  return `${cleanName}-${randomStr}${randomNum}`;
}
function generateVariantCombinations(variants) {
  if (!variants || variants.length === 0) return [];

  const [first, ...rest] = variants;
  let combinations = first.values.map((val) => ({ [first.name]: val }));

  for (const variant of rest) {
    combinations = combinations.flatMap((combo) =>
      variant.values.map((val) => ({
        ...combo,
        [variant.name]: val,
      }))
    );
  }

  return combinations;
}

exports.createProduct = async (req, res) => {
  try {
    const data = req.body;

    // Auto-fill seller/admin flags
    if (data.added_by === "admin") {
      data.seller_id = null;
      data.status = 1;
      data.request_status = 1;
    } else if (data.added_by === "seller") {
      data.status = 0;
      data.request_status = 0;
    }

    // Ensure name is present
    if (!data.name) {
      return res
        .status(400)
        .json({ error: "Product name is required to generate SKU." });
    }

    // Generate and attach unique product-level SKU
    let sku = generateSkuCode(data.name);
    while (await Product.findOne({ sku_code: sku })) {
      sku = generateSkuCode(data.name);
    }
    data.sku_code = sku;

    // Save product first
    const product = await Product.create(data);

    // If variants exist, handle variant options
    let variationOptions = [];

    if (data.variation_options?.length > 0) {
      // Use provided variation options
      variationOptions = data.variation_options.map((option) => ({
        product_id: product._id,
        variant_values: option.variant_values,
        price: option.price,
        stock: option.stock || 0,
        images: option.images || [],
        sku:
          option.sku ||
          generateSkuCode(
            data.name + "-" + Object.values(option.variant_values).join("-")
          ),
      }));
    } else if (data.variants?.length > 0) {
      // Auto-generate variation combinations
      const combinations = generateVariantCombinations(data.variants);
      variationOptions = combinations.map((variant_values) => ({
        product_id: product._id,
        variant_values,
        price: data.unit_price,
        stock: 10,
        images: [],
        sku: generateSkuCode(
          data.name + "-" + Object.values(variant_values).join("-")
        ),
      }));
    }

    if (variationOptions.length > 0) {
      await VariantOption.insertMany(variationOptions);
    }

    res.status(201).json({
      message: "Product created successfully",
      product,
      variant_count: variationOptions.length,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// exports.createProduct = async (req, res) => {
//   try {
//     const data = req.body;

//     // Auto-fill seller/admin flags
//     if (data.added_by === 'admin') {
//       data.seller_id = null;
//       data.status = 1;
//       data.request_status = 1;
//     } else if (data.added_by === 'seller') {
//       data.status = 0;
//       data.request_status = 0;
//     }

//     // Ensure name is present
//     if (!data.name) {
//       return res.status(400).json({ error: "Product name is required to generate SKU." });
//     }

//     // Generate and attach unique SKU
//     let sku = generateSkuCode(data.name);

//     // Ensure uniqueness in DB (in rare case of conflict)
//     let skuExists = await Product.findOne({ sku_code: sku });
//     while (skuExists) {
//       sku = generateSkuCode(data.name);
//       skuExists = await Product.findOne({ sku_code: sku });
//     }
//     data.sku_code = sku;

//     const product = await Product.create(data);
//     res.status(201).json(product);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// Admin - Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const { search = "", limit = 10, offset = 0 } = req.query;
    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = search ? { name: { $regex: search, $options: "i" } } : {};

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .populate("category_id sub_category_id seller_id")
      .lean(); // <-- lean() is needed to modify product objects directly

    // Fetch variation options for all found products
    const productIds = products.map((p) => p._id);
    const variantOptions = await VariantOption.find({
      product_id: { $in: productIds },
    }).lean();

    // Group variation options by product ID
    const grouped = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(variant);
    }

    // Attach variation_options to each product
    const enriched = products.map((prod) => ({
      ...prod,
      variation_options: grouped[prod._id.toString()] || [],
    }));

    res.json({
      message: "Products fetched successfully",
      data: enriched,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Frontend - Get All Active Products
exports.getActiveProducts = async (req, res) => {
  try {
    const { search = "", limit = 50, offset = 0 } = req.query;
    const parsedLimit = Math.max(1, Math.min(1000, parseInt(limit)));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = { status: 1, request_status: 1 };
    if (search) filter.name = { $regex: search, $options: "i" };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .populate("category_id sub_category_id seller_id")
      .lean();

    const productIds = products.map((p) => p._id);
    const variantOptions = await VariantOption.find({
      product_id: { $in: productIds },
    }).lean();

    // Group variants by product_id
    const groupedVariants = {};
    for (const v of variantOptions) {
      const pid = v.product_id.toString();
      if (!groupedVariants[pid]) groupedVariants[pid] = [];
      groupedVariants[pid].push(v);
    }

    // Attach variation_options to each product
    const enriched = products.map((prod) => ({
      ...prod,
      variation_options: groupedVariants[prod._id.toString()] || [],
    }));

    res.json({
      message: "Active products fetched",
      data: enriched,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Top Products
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 8, offset = 0 } = req.query;
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit)));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = { status: 1, request_status: 1, is_top: true };
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .populate("seller_id")
      .lean(); // Use lean() to allow adding properties

    // Get all product IDs
    const productIds = products.map((p) => p._id);
    const variantOptions = await VariantOption.find({
      product_id: { $in: productIds },
    }).lean();

    // Group variant options by product ID
    const grouped = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(variant);
    }

    // Attach variation_options to each product
    const enriched = products.map((prod) => ({
      ...prod,
      variation_options: grouped[prod._id.toString()] || [],
    }));

    res.json({
      message: "Top products fetched",
      data: enriched,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// New Products
exports.getNewProducts = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = { status: 1, request_status: 1 };
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .populate("seller_id")
      .lean(); // to allow modifying the response

    // Get all product IDs
    const productIds = products.map((p) => p._id);
    const variantOptions = await VariantOption.find({
      product_id: { $in: productIds },
    }).lean();

    // Group variant options by product ID
    const grouped = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(variant);
    }

    // Attach variation_options to each product
    const enriched = products.map((prod) => ({
      ...prod,
      variation_options: grouped[prod._id.toString()] || [],
    }));

    res.json({
      message: "New products fetched",
      data: enriched,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// By Category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = {
      status: 1,
      request_status: 1,
      category_id: req.params.category_id,
    };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .populate("seller_id")
      .lean(); // to allow direct object modification

    // Fetch all variation options for the selected products
    const productIds = products.map((p) => p._id);
    const variantOptions = await VariantOption.find({
      product_id: { $in: productIds },
    }).lean();

    // Group them by product_id
    const grouped = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(variant);
    }

    // Inject variation_options into each product
    const enriched = products.map((prod) => ({
      ...prod,
      variation_options: grouped[prod._id.toString()] || [],
    }));

    res.json({
      message: "Category-wise products fetched",
      data: enriched,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// By Subcategory
exports.getProductsBySubCategory = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = {
      status: 1,
      request_status: 1,
      sub_category_id: req.params.sub_category_id,
    };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .populate("seller_id")
      .lean(); // allow direct modification

    // Fetch all variation options for the current products
    const productIds = products.map((p) => p._id);
    const variantOptions = await VariantOption.find({
      product_id: { $in: productIds },
    }).lean();

    // Group variation options by product ID
    const grouped = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(variant);
    }

    // Merge variation options into each product
    const enrichedProducts = products.map((prod) => ({
      ...prod,
      variation_options: grouped[prod._id.toString()] || [],
    }));

    res.json({
      message: "Sub-category-wise products fetched",
      data: enrichedProducts,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      status: 1,
      request_status: 1,
    })
      .populate("seller_id", "shop_name logo")
      .lean();

    if (!product)
      return res.status(404).json({
        status: false,
        message: "Product not found or inactive",
      });

    // ✅ Fetch variant options from VariantOption table
    const variation_options = await VariantOption.find({
      product_id: req.params.id,
    }).lean();

    // ✅ Fetch active reviews for the product
    const reviews = await Review.find({
      product_id: req.params.id,
      status: "active",
    })
      .populate("user_id", "name profilePicture")
      .sort({ createdAt: -1 });

    // ✅ Calculate average rating
    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length
      ? (totalRatings / reviews.length).toFixed(1)
      : null;

    // ✅ Include variation_options in the product
    product.variation_options = variation_options;

    res.json({
      status: true,
      product,
      reviews,
      average_rating: avgRating,
      total_reviews: reviews.length,
    });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
};

// Admin: Get Product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category_id sub_category_id seller_id")
      .lean();

    if (!product) return res.status(404).json({ msg: "Product not found" });

    // Fetch variation options from separate collection
    const variation_options = await VariantOption.find({
      product_id: req.params.id,
    }).lean();

    // Inject variation_options into product response
    product.variation_options = variation_options;

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const data = req.body;

    // 1. Update product
    const updatedProduct = await Product.findByIdAndUpdate(productId, data, {
      new: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Update variation options if present
    if (Array.isArray(data.variation_options)) {
      // Delete existing variation options for this product
      await VariantOption.deleteMany({ product_id: productId });

      // Insert new variation options
      const newVariants = data.variation_options.map((variant) => ({
        ...variant,
        product_id: productId,
      }));

      await VariantOption.insertMany(newVariants);
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. Delete the product
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Delete associated variant options
    await VariantOption.deleteMany({ product_id: productId });

    res.json({ msg: "Product and related variants deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};