const Product = require("../../models/Product");
const VariantOption = require("../../models/VariantOption");
const Review = require("../../models/Review");
const mongoose = require('mongoose');

exports.getProductsBySeller = async (req, res) => {
    try {
        const sellerId = req.user?.id;

        if (!sellerId) {
            return res.status(401).json({ error: "Unauthorized: seller not identified" });
        }
        const {
            search = "",
            limit = 10,
            page = 1,
            min_price,
            max_price,
            min_rating
        } = req.query;
        const parsedLimit = Math.max(1, parseInt(limit));
        const parsedPage = Math.max(1, parseInt(page));
        const skip = (parsedPage - 1) * parsedLimit;

        const filter = {
            added_by: "seller",
            seller_id: new mongoose.Types.ObjectId(sellerId),
        };
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }
        if (min_price || max_price) {
            filter.unit_price = {};
            if (min_price) filter.unit_price.$gte = parseFloat(min_price);
            if (max_price) filter.unit_price.$lte = parseFloat(max_price);
        }
        let products = await Product.find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parsedLimit)
            .populate('category_id sub_category_id')
            .lean();
        const productIds = products.map((p) => p._id);
        // Avg rating filter
        if (min_rating !== undefined) {
            const reviews = await Review.aggregate([
                { $match: { product_id: { $in: productIds }, status: "active" } },
                { $group: { _id: "$product_id", avgRating: { $avg: "$rating" } } },
            ]);
            const ratingMap = {};
            reviews.forEach(r => {
                ratingMap[r._id.toString()] = r.avgRating;
            });
            products = products.filter(p => {
                const avg = ratingMap[p._id.toString()] ?? 0;
                return avg >= parseFloat(min_rating);
            });
        }

        const variantOptions = await VariantOption.find({
            product_id: { $in: products.map(p => p._id) }
        }).lean();

        const groupedVariants = {};
        variantOptions.forEach(variant => {
            const pid = variant.product_id.toString();
            if (!groupedVariants[pid]) groupedVariants[pid] = [];
            groupedVariants[pid].push(variant);
        });

        const enrichedProducts = products.map(prod => ({
            ...prod,
            variation_options: groupedVariants[prod._id.toString()] || [],
        }));

        const total = await Product.countDocuments(filter);

        res.json({
            message: "Seller products fetched successfully",
            data: enrichedProducts,
            page: parsedPage,
            limit: parsedLimit,
            total,
            totalPages: Math.ceil(total / parsedLimit)
        });
    } catch (err) {
        console.error("getProductsBySeller Error:", err);
        res.status(500).json({ error: err.message });
    }
};
