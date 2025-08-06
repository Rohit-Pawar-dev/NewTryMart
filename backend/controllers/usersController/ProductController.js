const Product = require("../../models/Product");
const Review = require("../../models/Review");
const VariantOption = require("../../models/VariantOption");
const Wishlist = require("../../models/wishlist");
const Cart = require("../../models/Cart");
const _ = require("lodash");

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
    const userCity = req.user?.city.toLowerCase();

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

    // Step 1: Fetch products without pagination
    let products = await Product.find(filter)
      .sort({ created_at: -1 })
      .populate({
        path: "seller_id",
        select: "city name",
      })
      .lean();

    // Step 2: Get average ratings
    const productIds = products.map((p) => p._id);
    const avgRatings = await Review.aggregate([
      { $match: { product_id: { $in: productIds }, status: "active" } },
      {
        $group: {
          _id: "$product_id",
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    const ratingMap = {};
    for (const r of avgRatings) {
      ratingMap[r._id.toString()] = r.avgRating;
    }

    // Step 3: Attach average_rating and apply min_rating filter
    products = products
      .map((product) => {
        const avg = ratingMap[product._id.toString()] || 0;
        if (min_rating && avg < parseFloat(min_rating)) return null;
        return { ...product, average_rating: avg };
      })
      .filter(Boolean);

    // Step 4: Prioritize city matches
    const cityMatched = [];
    const others = [];

    for (const product of products) {
      const sellerCity = product.seller_id?.city?.trim()?.toLowerCase() || "";
      if (userCity && sellerCity === userCity) {
        cityMatched.push(product);
      } else {
        others.push(product);
      }
    }

    const sortedProducts = [...cityMatched, ...others];

    // Step 5: Apply pagination after filtering
    const paginated = sortedProducts.slice(parsedOffset, parsedOffset + parsedLimit);

    res.json({
      message: "Offer products fetched",
      data: paginated,
      total: sortedProducts.length,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(sortedProducts.length / parsedLimit),
    });

  } catch (err) {
    console.error(err);
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

    const userCity = req.user?.city.toLowerCase();
    // console.log(userCity);

    let products = await Product.find(filter)
      .sort({ created_at: -1 })
      .populate({
        path: "seller_id",
        select: "city name",
      })
      .lean();

    const productIds = products.map((p) => p._id);

    // Step 2: Get average ratings
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

    // Step 3: Attach average_rating
    products = products.map((product) => {
      const avg = ratingMap[product._id.toString()] || 0;
      return { ...product, average_rating: avg };
    });

    // Step 4: Filter by rating if needed
    if (min_rating !== undefined) {
      const minRatingVal = parseFloat(min_rating);
      products = products.filter((p) => p.average_rating >= minRatingVal);
    }

    // Step 5: Prioritize by city match
    const cityMatched = [];
    const otherProducts = [];

    for (const product of products) {
      const sellerCity = product.seller_id?.city?.toLowerCase();
      if (userCity && sellerCity === userCity) {
        cityMatched.push(product);
      } else {
        otherProducts.push(product);
      }
    }

    const sortedProducts = [...cityMatched, ...otherProducts];
    const paginated = sortedProducts.slice(parsedOffset, parsedOffset + parsedLimit);

    res.json({
      message: "Trending products fetched",
      data: paginated,
      total: sortedProducts.length,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(sortedProducts.length / parsedLimit),
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

    const filter = {
      status: 1,
      request_status: 1,
      sub_category_id: req.params.sub_category_id,
    };

    if (min_price || max_price) {
      filter.unit_price = {};
      if (min_price) filter.unit_price.$gte = parseFloat(min_price);
      if (max_price) filter.unit_price.$lte = parseFloat(max_price);
    }

    // const userCity = city?.trim().toLowerCase();
    const userCity = req.user?.city.toLowerCase();

    // Step 1: Fetch products with seller info
    let products = await Product.find(filter)
      .sort({ created_at: -1 })
      .populate({
        path: "seller_id",
        select: "city name",
      })
      .lean();

    const productIds = products.map((p) => p._id);

    // Step 2: Get average ratings
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

    // Step 3: Attach average_rating
    products = products.map((product) => {
      const idStr = product._id.toString();
      const avg = ratingMap[idStr] || 0;
      return { ...product, average_rating: avg };
    });

    // Step 4: Filter by min_rating
    if (min_rating !== undefined) {
      const minRatingVal = parseFloat(min_rating);
      products = products.filter((p) => p.average_rating >= minRatingVal);
    }

    // Step 5: City-wise prioritization
    const cityMatched = [];
    const otherProducts = [];

    for (const product of products) {
      const sellerCity = product.seller_id?.city?.trim().toLowerCase() || "";
      if (userCity && sellerCity === userCity) {
        cityMatched.push(product);
      } else {
        otherProducts.push(product);
      }
    }

    const sortedProducts = [...cityMatched, ...otherProducts];

    // Step 6: Fetch variant options for visible products
    const paginated = sortedProducts.slice(parsedOffset, parsedOffset + parsedLimit);
    const paginatedIds = paginated.map((p) => p._id);

    const variantOptions = await VariantOption.find({
      product_id: { $in: paginatedIds },
    }).lean();

    const grouped = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(variant);
    }

    const enrichedProducts = paginated.map((prod) => ({
      ...prod,
      variation_options: grouped[prod._id.toString()] || [],
    }));

    res.json({
      message: "Sub-category-wise products fetched",
      data: enrichedProducts,
      total: sortedProducts.length,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(sortedProducts.length / parsedLimit),
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const userId = req.user?.id;

    const product = await Product.findOne({
      _id: req.params.id,
      status: 1,
      request_status: 1,
    })
      .populate("seller_id", "shop_name logo")
      .lean();

    if (!product) {
      return res.status(404).json({
        status: false,
        message: "Product not found or inactive",
      });
    }

    const variation_options = await VariantOption.find({
      product_id: req.params.id,
    }).lean();

    const reviews = await Review.find({
      product_id: req.params.id,
      status: "active",
    })
      .populate("user_id", "name profilePicture")
      .sort({ createdAt: -1 });

    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length
      ? (totalRatings / reviews.length).toFixed(1)
      : null;

    let cartItems = [];
    let wishlistItems = [];

    if (userId) {
      cartItems = await Cart.find({
        customer_id: userId,
        product_id: req.params.id,
      }).lean();

      wishlistItems = await Wishlist.find({
        userId: userId,
        productId: req.params.id,
      }).lean();
    }

    const enrichedVariationOptions = variation_options.map((option) => {
      const inCart = cartItems.some((item) => {
        return item.variant_id?.toString() === option._id?.toString();
      });

      const inWishlist = wishlistItems.some((item) => {
        return (
          item.variantValues &&
          Object.keys(item.variantValues).length > 0 &&
          _.isEqual(item.variantValues, option.variant_values)
        );
      });

      return {
        ...option,
        in_cart: inCart,
        in_wishlist: inWishlist,
      };
    });

    const productInCart = cartItems.some((item) => !item.is_variant);
    const productInWishlist = wishlistItems.some(
      (item) => !item.variantValues || Object.keys(item.variantValues).length === 0
    );

    product.variation_options = enrichedVariationOptions;

    res.json({
      status: true,
      product: {
        ...product,
        in_cart: productInCart,
        in_wishlist: productInWishlist,
      },
      reviews,
      average_rating: avgRating,
      total_reviews: reviews.length,
    });
  } catch (err) {
    console.error("Get product details error:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};

