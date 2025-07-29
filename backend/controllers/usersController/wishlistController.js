const mongoose = require('mongoose');  // <--- Add this line

const Wishlist = require('../../models/wishlist');
const Cart = require('../../models/Cart');
const { log } = require('console');

/**
 * Wishlist Controller
 * Handles adding, retrieving, and removing items from the user's wishlist.
 */

exports.addToWishlist = async (req, res) => {
    try {
        const { userId, productId, variantValues } = req.body;

        if (!productId) {
            return res.status(400).json({
                status: false,
                message: "Product ID is required",
            });
        }

        const existingWishlistItem = await Wishlist.findOne({
            userId,
            productId,
            variantValues: variantValues,
        });

        if (existingWishlistItem) {
            return res.status(400).json({
                status: false,
                message: "Item already exists in wishlist",
            });
        }

        await Cart.findOneAndDelete({
            customer_id: userId,
            product_id: productId,
            ...(variantValues && Object.keys(variantValues).length > 0 && {
                selected_variant: variantValues,
            }),
        });

        const newWishlistItem = new Wishlist({
            userId,
            productId,
            variantValues,
        });

        await newWishlistItem.save();

        return res.status(201).json({
            status: true,
            message: "Item added to wishlist and removed from cart",
            data: newWishlistItem,
        });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};


exports.getWishlist = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                status: false,
                message: "User ID is required",
            });
        }

        // Convert userId string to ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const wishlistItems = await Wishlist.find({ userId: userObjectId }).populate('productId');

        return res.status(200).json({
            status: true,
            message: "Wishlist retrieved successfully",
            data: wishlistItems,
        });

    } catch (error) {
        console.error("Error retrieving wishlist:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.removeFromWishlist = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = (req.query && req.query.userId) || (req.body && req.body.userId);

        // console.log("Removing wishlist item:", { itemId, userId });

        if (!userId) {
            return res.status(400).json({ status: false, message: "User ID is required" });
        }
        if (!itemId) {
            return res.status(400).json({ status: false, message: "Wishlist item ID is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ status: false, message: "Invalid user ID or item ID" });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const productObjectId = new mongoose.Types.ObjectId(itemId);
        const wishlistItem = await Wishlist.findOneAndDelete({ productId: productObjectId, userId: userObjectId });
        if (!wishlistItem) {
            return res.status(404).json({ status: false, message: "Item not found in wishlist" });
        }

        return res.status(200).json({ status: true, message: "Item removed from wishlist successfully" });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};

