const Product = require("../../models/Product");
const Review = require("../../models/Review");
const VariantOption = require("../../models/VariantOption");

// Frontend

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

exports.getActiveProducts = async (req, res) => {
  try {
    const {
      search = "",
      limit = 50,
      offset = 0,
      min_price,
      max_price,
      min_rating,
    } = req.query;

    const parsedLimit = Math.max(1, Math.min(1000, parseInt(limit)));
    const parsedOffset = Math.max(0, parseInt(offset));

    // Base filter: only active and approved products
    const filter = {
      status: 1,
      request_status: 1,
      ...(search && { name: { $regex: search, $options: "i" } }),
    };

    // Apply price filters
    if (min_price || max_price) {
      filter.unit_price = {};
      if (min_price) filter.unit_price.$gte = parseFloat(min_price);
      if (max_price) filter.unit_price.$lte = parseFloat(max_price);
    }

    // Fetch paginated products
    let products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .lean();

    const productIds = products.map((p) => p._id);

    // Filter by rating if applicable
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

    // Fetch variant options
    const filteredProductIds = products.map((p) => p._id);
    const variantOptions = await VariantOption.find({
      product_id: { $in: filteredProductIds },
    }).lean();

    const groupedVariants = {};
    for (const v of variantOptions) {
      const pid = v.product_id.toString();
      if (!groupedVariants[pid]) groupedVariants[pid] = [];
      groupedVariants[pid].push(v);
    }

    const enriched = products.map((prod) => ({
      ...prod,
      variation_options: groupedVariants[prod._id.toString()] || [],
    }));

    // Adjust total if min_rating is used (reflects post-filter count)
    const total =
      min_rating !== undefined
        ? enriched.length
        : await Product.countDocuments(filter);

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

exports.offersForYou = async (req, res) => {
  try {
    const {
      limit = 8,
      offset = 0,
      min_price,
      max_price,
      min_rating,
    } = req.query;
    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = {
      status: 1,
      request_status: 1,
      is_offers: true,
    };

    if (min_price || max_price) {
      filter.unit_price = {};
      if (min_price) filter.unit_price.$gte = parseFloat(min_price);
      if (max_price) filter.unit_price.$lte = parseFloat(max_price);
    }

    let products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit);

    if (min_rating !== undefined) {
      const productIds = products.map((p) => p._id);

      const reviews = await Review.aggregate([
        { $match: { product_id: { $in: productIds }, status: "active" } },
        {
          $group: {
            _id: "$product_id",
            avgRating: { $avg: "$rating" },
          },
        },
      ]);

      // Create a map of avg ratings
      const ratingMap = {};
      for (const r of reviews) {
        ratingMap[r._id.toString()] = r.avgRating;
      }

      products = products.filter((p) => {
        const idStr = p._id.toString();
        const avg = ratingMap[idStr] !== undefined ? ratingMap[idStr] : 0;
        return avg >= parseFloat(min_rating);
      });
    }

    const total = await Product.countDocuments(filter);

    res.json({
      message: "Offer products fetched",
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

exports.trendingProducts = async (req, res) => {
  try {
    const {
      limit = 8,
      offset = 0,
      min_price,
      max_price,
      min_rating,
    } = req.query;

    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = {
      status: 1,
      request_status: 1,
      is_trending: true,
    };

    if (min_price || max_price) {
      filter.unit_price = {};
      if (min_price) filter.unit_price.$gte = parseFloat(min_price);
      if (max_price) filter.unit_price.$lte = parseFloat(max_price);
    }

    let products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .populate("seller_id");

    if (min_rating !== undefined) {
      const productIds = products.map((p) => p._id);

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
        const idStr = p._id.toString();
        const avg = ratingMap[idStr] !== undefined ? ratingMap[idStr] : 0;
        return avg >= parseFloat(min_rating);
      });
    }

    const total = await Product.countDocuments(filter);

    res.json({
      message: "Trending products fetched",
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
    const {
      limit = 10,
      offset = 0,
      min_price,
      max_price,
      min_rating,
    } = req.query;

    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    // Base product filter
    const filter = {
      status: 1,
      request_status: 1,
    };

    // Add price filters if provided
    if (min_price || max_price) {
      filter.unit_price = {};
      if (min_price) filter.unit_price.$gte = parseFloat(min_price);
      if (max_price) filter.unit_price.$lte = parseFloat(max_price);
    }

    // Fetch initial product set
    let products = await Product.find(filter)
      .sort({ created_at: -1 }) // Newest first
      .skip(parsedOffset)
      .limit(parsedLimit)
      .lean();

    const productIds = products.map((p) => p._id);

    // Filter by rating if specified
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

    // Fetch variant options for remaining products
    const filteredProductIds = products.map((p) => p._id);
    const variantOptions = await VariantOption.find({
      product_id: { $in: filteredProductIds },
    }).lean();

    const grouped = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(variant);
    }

    const enriched = products.map((prod) => ({
      ...prod,
      variation_options: grouped[prod._id.toString()] || [],
    }));

    // Adjust total count if min_rating is applied
    const total =
      min_rating !== undefined
        ? enriched.length
        : await Product.countDocuments(filter);

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
    const {
      limit = 20,
      offset = 0,
      min_price,
      max_price,
      min_rating,
    } = req.query;

    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    // Base product filter
    const filter = {
      status: 1,
      request_status: 1,
      category_id: req.params.category_id,
    };

    // Apply price filters if present
    if (min_price || max_price) {
      filter.unit_price = {};
      if (min_price) filter.unit_price.$gte = parseFloat(min_price);
      if (max_price) filter.unit_price.$lte = parseFloat(max_price);
    }

    // Fetch products
    let products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .lean();

    const productIds = products.map((p) => p._id);

    // Apply rating filter if needed
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

    // Get variation options
    const filteredProductIds = products.map((p) => p._id);
    const variantOptions = await VariantOption.find({
      product_id: { $in: filteredProductIds },
    }).lean();

    const grouped = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(variant);
    }

    const enriched = products.map((prod) => ({
      ...prod,
      variation_options: grouped[prod._id.toString()] || [],
    }));

    // Adjust total count if rating filter applied
    const total =
      min_rating !== undefined
        ? enriched.length
        : await Product.countDocuments(filter);

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
    const {
      limit = 20,
      offset = 0,
      min_price,
      max_price,
      min_rating,
    } = req.query;

    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    // Build initial filter
    const filter = {
      status: 1,
      request_status: 1,
      sub_category_id: req.params.sub_category_id,
    };

    // Apply price range filters if provided
    if (min_price || max_price) {
      filter.unit_price = {};
      if (min_price) filter.unit_price.$gte = parseFloat(min_price);
      if (max_price) filter.unit_price.$lte = parseFloat(max_price);
    }

    // Fetch products
    let products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .lean();

    const productIds = products.map((p) => p._id);

    // Filter by rating if needed
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

    // Get variation options for filtered products
    const filteredProductIds = products.map((p) => p._id);
    const variantOptions = await VariantOption.find({
      product_id: { $in: filteredProductIds },
    }).lean();

    const grouped = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(variant);
    }

    const enrichedProducts = products.map((prod) => ({
      ...prod,
      variation_options: grouped[prod._id.toString()] || [],
    }));

    // Adjust total if min_rating was applied
    const total =
      min_rating !== undefined
        ? enrichedProducts.length
        : await Product.countDocuments(filter);

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
