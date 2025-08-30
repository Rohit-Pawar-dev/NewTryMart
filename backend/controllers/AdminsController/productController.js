const Product = require("../../models/Product");
const VariantOption = require("../../models/VariantOption");
const Review = require("../../models/Review");
const mongoose = require('mongoose');
const path = require('path');

const generateSkuCode = (base) => {
  return (
    base
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") +
    "-" +
    Math.floor(Math.random() * 100000)
  );
};

const generateSlug = (name) => {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") +
    "-" +
    Math.floor(Math.random() * 10000)
  );
};

const generateVariantCombinations = (variants) => {
  const combine = (index, current) => {
    if (index === variants.length) return [current];

    return variants[index].values.flatMap((value) =>
      combine(index + 1, { ...current, [variants[index].name]: value })
    );
  };

  return combine(0, {});
};


exports.createProduct = async (req, res) => {
  try {
    const data = req.body;
    if (data.added_by === "admin") {
      data.seller_id = null;
      data.status = 1;
      data.request_status = 1;
    } else if (data.added_by === "seller") {
      data.status = 1;
      data.request_status = 1;
    }
    if (!data.name) {
      return res.status(400).json({ error: "Product name is required to generate SKU." });
    }
    let sku = generateSkuCode(data.name);
    while (await Product.findOne({ sku_code: sku })) {
      sku = generateSkuCode(data.name);
    }
    data.sku_code = sku;
    let slug = generateSlug(data.name);
    while (await Product.findOne({ slug })) {
      slug = generateSlug(data.name);
    }
    data.slug = slug;
    const [product] = await Product.create([data]);
    let variationOptions = [];

    if (data.variation_options?.length > 0) {
      for (const option of data.variation_options) {
        let variantSku = option.sku || generateSkuCode(
          data.name + "-" + Object.values(option.variant_values).join("-")
        );

        while (await VariantOption.findOne({ sku: variantSku })) {
          variantSku = generateSkuCode(data.name + "-" + Object.values(option.variant_values).join("-"));
        }

        variationOptions.push({
          product_id: product._id,
          variant_values: option.variant_values,
          price: option.price,
          stock: option.stock || 0,
          images: option.images || [],
          sku: variantSku,
        });
      }
    } else if (data.variants?.length > 0) {
      const combinations = generateVariantCombinations(data.variants);

      for (const variant_values of combinations) {
        let variantSku = generateSkuCode(data.name + "-" + Object.values(variant_values).join("-"));

        while (await VariantOption.findOne({ sku: variantSku })) {
          variantSku = generateSkuCode(data.name + "-" + Object.values(variant_values).join("-"));
        }

        variationOptions.push({
          product_id: product._id,
          variant_values,
          price: data.unit_price,
          stock: 10,
          images: [],
          sku: variantSku,
        });
      }
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

exports.getAllProducts = async (req, res) => {
  try {
    const {
      search = "",
      limit = 10,
      offset = 0,
      min_price,
      max_price,
      min_rating,
      added_by,
      request_status,
    } = req.query;

    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (added_by) {
      const roles = added_by.split(",").map((r) => r.trim().toLowerCase());
      filter.added_by = { $in: roles };
    }

    if (request_status !== undefined) {
      const parsedStatus = parseInt(request_status);
      if ([0, 1, 2].includes(parsedStatus)) {
        filter.request_status = parsedStatus;
      }
    }

    if (min_price || max_price) {
      filter.unit_price = {};
      if (min_price) filter.unit_price.$gte = parseFloat(min_price);
      if (max_price) filter.unit_price.$lte = parseFloat(max_price);
    }


    let products = await Product.find(filter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .populate("category_id sub_category_id seller_id")
      .lean();

    const productIds = products.map((p) => p._id);

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

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category_id sub_category_id seller_id")
      .lean();
    if (!product) return res.status(404).json({ msg: "Product not found" });
    const variation_options = await VariantOption.find({
      product_id: req.params.id,
    }).lean();
    product.variation_options = variation_options;
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const data = req.body;

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (
      existingProduct.request_status === 0 &&
      data.status === 1 &&
      existingProduct.status === 0
    ) {
      return res.status(400).json({
        error: "Product must be approved (request_status = 1) before activating.",
      });
    }

    if (
      existingProduct.request_status === 0 &&
      data.request_status === 1 &&
      existingProduct.status === 0 &&
      data.status === undefined
    ) {
      data.status = 0;
    }

    if (data.name && data.name !== existingProduct.name) {
      let newSlug = generateSlug(data.name);
      while (await Product.findOne({ slug: newSlug, _id: { $ne: productId } })) {
        newSlug = generateSlug(data.name);
      }
      data.slug = newSlug;

      let newSku = generateSkuCode(data.name);
      while (await Product.findOne({ sku_code: newSku, _id: { $ne: productId } })) {
        newSku = generateSkuCode(data.name);
      }
      data.sku_code = newSku;
    }
    const updatedProduct = await Product.findByIdAndUpdate(productId, data, {
      new: true,
    });
    if (Array.isArray(data.variation_options)) {
      await VariantOption.deleteMany({ product_id: productId });

      const newVariants = [];
      for (let i = 0; i < data.variation_options.length; i++) {
        const variant = data.variation_options[i];
        const base = updatedProduct.name + '-' + Object.values(variant.variant_values || {}).join("-");

        let sku = variant.sku;
        if (typeof sku !== "string" || sku.trim() === "") {
          sku = generateSkuCode(base);
        }
        while (await VariantOption.findOne({ sku, product_id: { $ne: productId } })) {
          sku = generateSkuCode(base);
        }

        newVariants.push({
          ...variant,
          sku,
          product_id: productId,
        });
      }

      await VariantOption.insertMany(newVariants);
    }

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ error: err.message });
  }
};

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

exports.changeProductRequestStatus = async (req, res) => {
  try {
    const productId = req.params.id;
    let { request_status } = req.body;

    // Ensure request_status is a number
    request_status = Number(request_status);

    // Validate request_status value
    if (![0, 1, 2].includes(request_status)) {
      return res.status(400).json({ error: "Invalid request status value. Allowed: 0, 1, 2" });
    }

    // Determine product status based on request_status
    let productStatus = 0; // default to inactive
    if (request_status === 1) {
      productStatus = 1; // approved -> active
    }

    // Update product in one query
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { request_status, status: productStatus },
      { new: true } // return updated product
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({
      message: "Request status updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Error updating request status:", err);
    return res.status(500).json({ error: "Server error occurred" });
  }
};

exports.status_update = async (req, res) => {
  try {
    const { id, status } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: 0, message: "Product not found" });
    }

    let success = 1;

    if (status === 1) {
      if (
        product.added_by === "seller" &&
        (product.request_status === 0 || product.request_status === 2)
      ) {
        success = 0;
      } else {
        product.status = status;
      }
    } else {
      product.status = status;
    }

    await product.save();

    return res.status(200).json({ success });
  } catch (err) {
    console.error("Status Update Error:", err);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.uploadThumbnail = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join('uploads', 'products', 'thumbnails', req.file.filename).replace(/\\/g, '/');
  res.status(201).json({ path: filePath });
};

exports.uploadProductImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join('uploads', 'products', 'images', req.file.filename).replace(/\\/g, '/');
  res.status(201).json({ path: filePath });
};

exports.uploadVariantImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join('uploads', 'products', 'variants', req.file.filename).replace(/\\/g, '/');
  res.status(201).json({ path: filePath });
};
