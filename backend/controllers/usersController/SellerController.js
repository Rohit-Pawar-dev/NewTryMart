const Seller = require("../../models/Seller"); // adjust path if needed
const Product = require("../../models/Product");
const VariantOption = require("../../models/VariantOption");

const MEDIA_URL = process.env.MEDIA_URL || "";

exports.getAllSellers = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    const filter = { status: "active" };

    const total = await Seller.countDocuments(filter);

    let sellers = await Seller.find(filter)
      .skip(parsedOffset)
      .limit(parsedLimit)
      .sort({ created_at: -1 });

    // Append full logo URL
    sellers = sellers.map((seller) => {
      return {
        ...seller._doc,
        logo: seller.logo ? `${MEDIA_URL}${seller.logo}` : null,
      };
    });

    res.json({
      status: true,
      message: "Sellers fetched successfully",
      data: sellers,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    console.error("Error fetching sellers:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getSellerDetails = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const { limit = 10, offset = 0 } = req.query;

    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    // Fetch the seller
    const seller = await Seller.findById(sellerId).lean();
    if (!seller) {
      return res
        .status(404)
        .json({ status: false, message: "Seller not found" });
    }

    // Append full logo URL
    seller.logo = seller.logo ? `${MEDIA_URL}${seller.logo}` : null;

    // Fetch seller's active products
    const productFilter = {
      seller_id: sellerId,
      status: 1,
      request_status: 1,
    };

    const total = await Product.countDocuments(productFilter);

    const products = await Product.find(productFilter)
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .populate("category_id sub_category_id seller_id")
      .lean();

    // Get all product IDs
    const productIds = products.map((p) => p._id);

    // Fetch variant options
    const variantOptions = await VariantOption.find({
      product_id: { $in: productIds },
    }).lean();

    // Group variants by product_id
    const groupedVariants = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!groupedVariants[pid]) groupedVariants[pid] = [];
      groupedVariants[pid].push(variant);
    }

    // Attach variation_options to each product
    const enrichedProducts = products.map((prod) => ({
      ...prod,
      variation_options: groupedVariants[prod._id.toString()] || [],
    }));

    res.json({
      status: true,
      message: "Seller and products fetched successfully",
      data: {
        seller,
        products: enrichedProducts,
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("getSellerDetails error:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
