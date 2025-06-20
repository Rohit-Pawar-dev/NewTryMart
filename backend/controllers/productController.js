const Product = require("../models/Product");
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

function generateSkuCode(name) {
  const cleanName = name.toLowerCase().replace(/\s+/g, "-").substring(0, 10);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4-char random
  const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit number
  return `${cleanName}-${randomStr}${randomNum}`;
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

    // ✅ Auto-generate variation_options if not provided
    if (!data.variation_options && data.variants?.length > 0) {
      const combinations = generateVariantCombinations(data.variants);
      data.variation_options = combinations.map((variant_values, i) => ({
        variant_values,
        price: data.unit_price, // You can customize this per variant if needed
        stock: 10, // Default stock
        images: [], // Default empty, frontend/admin can update later
        sku: generateSkuCode(
          data.name + "-" + Object.values(variant_values).join("-")
        ),
      }));
    }

    const product = await Product.create(data);
    res.status(201).json(product);
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
      .populate("category_id sub_category_id seller_id");

    res.json({
      message: "Products fetched successfully",
      data: products,
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
      .populate("seller_id");

    res.json({
      message: "Active products fetched",
      data: products,
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
      .populate("seller_id");

    res.json({
      message: "Top products fetched",
      data: products,
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
      .populate("seller_id");

    res.json({
      message: "New products fetched",
      data: products,
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
      .populate("seller_id");

    res.json({
      message: "Category-wise products fetched",
      data: products,
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
      .populate("seller_id");

    res.json({
      message: "Sub-category-wise products fetched",
      data: products,
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
    }).populate("seller_id", "shop_name logo");

    if (!product)
      return res
        .status(404)
        .json({ status: false, message: "Product not found or inactive" });

    // ✅ Fetch active reviews for the product
    const reviews = await Review.find({
      product_id: req.params.id,
      status: "active",
    })
      .populate("user_id", "name profilePicture") // optional user info
      .sort({ createdAt: -1 });

    // ✅ Calculate average rating
    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length
      ? (totalRatings / reviews.length).toFixed(1)
      : null;

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
    const product = await Product.findById(req.params.id).populate(
      "category_id sub_category_id seller_id"
    );
    if (!product) return res.status(404).json({ msg: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update
exports.updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: "Product deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
