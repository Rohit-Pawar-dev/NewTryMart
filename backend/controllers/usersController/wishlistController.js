const mongoose = require('mongoose');
const Wishlist = require('../../models/wishlist');
const Cart = require('../../models/Cart');

exports.addToWishlist = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { productId, variantValues } = req.body;

        if (!userId) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized: User not logged in",
            });
        }

        if (!productId) {
            return res.status(400).json({
                status: false,
                message: "Product ID is required",
            });
        }

        const existingWishlistItem = await Wishlist.findOne({
            userId,
            productId,
            variantValues,
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
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized: User not logged in",
            });
        }

        const userObjectId = mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : null;

        if (!userObjectId) {
            return res.status(400).json({
                status: false,
                message: "Invalid user ID",
            });
        }

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
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized: User not logged in" });
        }
        if (!itemId) {
            return res.status(400).json({ status: false, message: "Wishlist item ID is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ status: false, message: "Invalid user ID or item ID" });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
          const productObjectId = new mongoose.Types.ObjectId(itemId);

        const wishlistItem = await Wishlist.findOneAndDelete({productId: productObjectId, userId: userObjectId });

        if (!wishlistItem) {
            return res.status(404).json({ status: false, message: "Item not found in wishlist" });
        }

        return res.status(200).json({ status: true, message: "Item removed from wishlist successfully" });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};
