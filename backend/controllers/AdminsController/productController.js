const Product = require("../../models/Product");
const VariantOption = require("../../models/VariantOption");
const Review = require("../../models/Review");
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
    const {
      search = "",
      limit = 10,
      offset = 0,
      min_price,
      max_price,
      min_rating,
      added_by, // Accept "admin", "seller", or comma-separated list
    } = req.query;

    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = {};

    // Text search on product name
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // Filter by added_by (admin/seller)
    if (added_by) {
      const roles = added_by.split(",").map((r) => r.trim().toLowerCase());
      filter.added_by = { $in: roles };
    }

    // Price filter
    if (min_price || max_price) {
      filter.unit_price = {};
      if (min_price) filter.unit_price.$gte = parseFloat(min_price);
      if (max_price) filter.unit_price.$lte = parseFloat(max_price);
    }

    // Get products with base filters
    let products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .populate("category_id sub_category_id seller_id")
      .lean();

    const productIds = products.map((p) => p._id);

    // Filter by average rating if provided
    if (min_rating !== undefined) {
      const reviews = await Review.aggregate([
        { $match: { product_id: { $in: productIds }, status: "active" } },
        {
          $group: {
            _id: "$product_id",
            avgRating: { $avg: "$rating" },
          },
        },
      ]);

      const ratingMap = {};
      for (const r of reviews) {
        ratingMap[r._id.toString()] = r.avgRating;
      }

      products = products.filter((p) => {
        const avg = ratingMap[p._id.toString()] ?? 0;
        return avg >= parseFloat(min_rating);
      });
    }

    // Get variant options per product
    const filteredProductIds = products.map((p) => p._id);
    const variantOptions = await VariantOption.find({
      product_id: { $in: filteredProductIds },
    }).lean();

    // Group variant options by product ID
    const grouped = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(variant);
    }

    // Inject variant options into product
    const enriched = products.map((prod) => ({
      ...prod,
      variation_options: grouped[prod._id.toString()] || [],
    }));

    // Total count (adjusted if rating is filtered)
    const total =
      min_rating !== undefined
        ? enriched.length
        : await Product.countDocuments(filter);

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

    // 1. Find existing product
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Business logic check: Prevent activating if not approved
    const incomingStatus = data.status;
    const incomingRequestStatus = data.request_status;

    // If the product is pending approval, and someone tries to activate it
    if (
      existingProduct.request_status === 0 &&
      incomingStatus === 1 &&
      existingProduct.status === 0
    ) {
      return res.status(400).json({
        error:
          "Product must be approved (request_status = 1) before activating.",
      });
    }

    // If admin approves the product (request_status = 1) — optionally auto-activate
    if (
      existingProduct.request_status === 0 &&
      incomingRequestStatus === 1 &&
      existingProduct.status === 0 &&
      incomingStatus === undefined
    ) {
      // Auto set status to inactive (admin must explicitly activate later)
      data.status = 0;
    }

    // 3. Update product
    const updatedProduct = await Product.findByIdAndUpdate(productId, data, {
      new: true,
    });

    // 4. Handle variation options
    if (Array.isArray(data.variation_options)) {
      await VariantOption.deleteMany({ product_id: productId });

      const newVariants = data.variation_options.map((variant) => ({
        ...variant,
        product_id: productId,
      }));

      await VariantOption.insertMany(newVariants);
    }

    res.json(updatedProduct);
  } catch (err) {
    console.error("Update error:", err);
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

// Change request status (0: pending, 1: approved, 2: denied)
exports.changeProductRequestStatus = async (req, res) => {
  try {
    const productId = req.params.id;
    const { request_status } = req.body;

    // Validate request_status value
    if (![0, 1, 2].includes(request_status)) {
      return res.status(400).json({ error: "Invalid request status value." });
    }

    // Find product by ID
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update request_status
    product.request_status = request_status;

    // Update product active status based on request_status
    if (request_status === 1) {
      // Approved: activate product
      product.status = 1;
    } else if (request_status === 2) {
      // Denied: deactivate product
      product.status = 0;
    } else if (request_status === 0) {
      // Pending: optionally deactivate product or keep current
      // Here I choose to deactivate product for safety
      product.status = 0;
    }

    // Save updated product
    await product.save();

    return res.json({
      message: "Request status updated successfully",
      product,
    });
  } catch (err) {
    console.error("Error updating request status:", err);
    return res.status(500).json({ error: "Server error occurred" });
  }
};
