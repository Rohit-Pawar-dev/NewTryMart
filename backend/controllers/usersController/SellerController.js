const Seller = require("../../models/Seller"); 
const Product = require("../../models/Product");
const VariantOption = require("../../models/VariantOption");
const mongoose = require('mongoose');


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

// exports.getSellerDetails = async (req, res) => {
//   try {
//     const sellerId = req.params.sellerId;
//     const { limit = 10, offset = 0 } = req.query;

//     const parsedLimit = Math.max(1, parseInt(limit));
//     const parsedOffset = Math.max(0, parseInt(offset));

//     // Fetch seller info
//     const seller = await Seller.findById(sellerId).lean();
//     if (!seller) {
//       return res
//         .status(404)
//         .json({ status: false, message: "Seller not found" });
//     }

//     // seller.logo = seller.logo ? `${MEDIA_URL}${seller.logo}` : null;
  
//     console.log(sellerId);
    

//     // Filter for seller's approved and active products
//     const productFilter = {
//       seller_id: sellerId,
//       status: 1,
//       request_status: 1,
//     };

//     const total = await Product.countDocuments(productFilter);
//     // const products1 = await Product.find();
//   // console.log(products1);
//     const products = await Product.find(productFilter)
//       .sort({ created_at: -1 })
//       .skip(parsedOffset)
//       .limit(parsedLimit)
//       .populate("category_id sub_category_id seller_id")
//       .lean();

//     const productIds = products.map((p) => p._id);

//     const variantOptions = await VariantOption.find({
//       product_id: { $in: productIds },
//     }).lean();

//     // Group variant options by product ID
//     const groupedVariants = {};
//     for (const variant of variantOptions) {
//       const pid = variant.product_id.toString();
//       if (!groupedVariants[pid]) groupedVariants[pid] = [];
//       groupedVariants[pid].push(variant);
//     }

//     const enrichedProducts = products.map((prod) => ({
//       ...prod,
//       variation_options: groupedVariants[prod._id.toString()] || [],
//     }));

//     // Final response
//     res.status(200).json({
//       status: true,
//       message: "Seller details fetched successfully",
//       data: {
//         seller,
//       },
//       products: enrichedProducts,
//       total,
//       limit: parsedLimit,
//       offset: parsedOffset,
//       totalPages: Math.ceil(total / parsedLimit),
//     });
//   } catch (error) {
//     console.error("getSellerDetails error:", error);
//     res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };
exports.getSellerDetails = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedOffset = Math.max(0, parseInt(offset));

    //  Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid seller ID",
      });
    }

    //  Convert to ObjectId
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    //  Fetch seller info
    const seller = await Seller.findById(sellerObjectId).lean();
    if (!seller) {
      return res.status(404).json({
        status: false,
        message: "Seller not found",
      });
    }

    // Filter for seller's approved and active products
    const productFilter = {
      seller_id: sellerObjectId,
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

    const productIds = products.map((p) => p._id);

    const variantOptions = await VariantOption.find({
      product_id: { $in: productIds },
    }).lean();

    //  Group variant options by product ID
    const groupedVariants = {};
    for (const variant of variantOptions) {
      const pid = variant.product_id.toString();
      if (!groupedVariants[pid]) groupedVariants[pid] = [];
      groupedVariants[pid].push(variant);
    }

    const enrichedProducts = products.map((prod) => ({
      ...prod,
      variation_options: groupedVariants[prod._id.toString()] || [],
    }));

    // Final response
    res.status(200).json({
      status: true,
      message: "Seller details fetched successfully",
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
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};