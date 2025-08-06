const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const VariantOption = require("../../models/VariantOption");
const Mongoose = require("mongoose");
const Wishlist = require("../../models/wishlist");
const BusinessSetup = require('../../models/BussinessSetup');
module.exports = {

  async getCart(req, res) {
    const userId = req.user?.id;
    try {
      const cartItems = await Cart.find({
        customer_id: userId,
        save_for_later: false,
      }).lean();

      // Extract all product_ids and variant_ids from cart
      const productIds = cartItems.map(item => item.product_id);
      const variantIds = cartItems
        .filter(item => item.is_variant && item.variant_id)
        .map(item => item.variant_id);

      const products = await Product.find({ _id: { $in: productIds } }).lean();
      const variants = await VariantOption.find({ _id: { $in: variantIds } }).lean();

      const productMap = new Map(products.map(p => [p._id.toString(), p]));
      const variantMap = new Map(variants.map(v => [v._id.toString(), v]));

      let totalAmount = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      let couponAmount = 0;
      let couponCode = null;
      let totalBasePrice = 0;
      let totalPriceAfterDiscount = 0;

      const updatedCart = [];

      for (const item of cartItems) {
        let basePrice = 0,
          discountAmount = 0,
          taxAmount = 0,
          finalPrice = 0;

        const product = productMap.get(item.product_id.toString());
        if (!product) continue;

        let variant = null;
        if (item.is_variant && item.variant_id) {
          variant = variantMap.get(item.variant_id.toString());
          if (!variant) continue;
          basePrice = variant.price;
        } else {
          basePrice = product.unit_price;
        }

        // Calculate discount
        if (product.discount_type === "percent") {
          discountAmount = (product.discount / 100) * basePrice;
        } else {
          discountAmount = product.discount;
        }
        discountAmount = Math.min(discountAmount, basePrice);

        const priceAfterDiscount = basePrice - discountAmount;

        // Calculate tax
        taxAmount = (product.tax / 100) * priceAfterDiscount;
        finalPrice = priceAfterDiscount + taxAmount;

        totalDiscount += discountAmount * item.quantity;
        totalTax += taxAmount * item.quantity;
        totalAmount += finalPrice * item.quantity;

        totalBasePrice += basePrice * item.quantity;
        totalPriceAfterDiscount += priceAfterDiscount * item.quantity;

        if (item.coupon_code && item.coupon_amount && couponAmount === 0) {
          couponAmount = item.coupon_amount;
          couponCode = item.coupon_code;
        }

        updatedCart.push({
          ...item,
          variant,
          product_name: product.name,
          thumbnail: product.thumbnail,
          base_price: basePrice,
          discount: discountAmount,
          price_after_discount: priceAfterDiscount,
          tax: taxAmount,
          final_price: finalPrice,
        });
      }

      // Fetch delivery charges once
      const businessSetup = await BusinessSetup.findOne().lean();
      const deliveryCharges = businessSetup?.deliveryCharges || 0;

      const subtotalAfterCoupon = Math.max(0, totalAmount - couponAmount);
      const finalTotalAmount = subtotalAfterCoupon + deliveryCharges;

      res.json({
        status: true,
        message: "Cart fetched successfully",
        data: {
          cartItems: updatedCart,
          totalAmount: finalTotalAmount,
          totalDiscount,
          totalTax,
          coupon: couponCode
            ? {
              code: couponCode,
              discount: couponAmount,
            }
            : null,
          breakdown: {
            totalBasePrice,
            totalDiscount,
            totalPriceAfterDiscount,
            totalTax,
            couponAmount,
            deliveryCharges,
            finalPayable: finalTotalAmount,
          },
        },
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
  async addToCart(req, res) {
    const userId = req.user?.id;
    const { productId, variantId, is_variant, quantity = 1 } = req.body;

    // console.log(userId);
    if (!userId || !productId) {
      return res
        .status(400)
        .json({ status: false, message: "userId and productId are required" });
    }

    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ status: false, message: "Product not found" });
      }

      let variant = null;
      let finalPrice = product.unit_price;
      let stock = product.current_stock;
      let selectedVariant = null;

      if (is_variant && variantId) {
        variant = await VariantOption.findOne({
          _id: variantId,
          product_id: productId,
        });

        if (!variant) {
          return res
            .status(404)
            .json({ status: false, message: "Variant not found" });
        }

        finalPrice = variant.price;
        stock = variant.stock;
        selectedVariant =
          variant?.options && Object.keys(variant.options).length > 0
            ? variant.options
            : {};
      }

      //  Create a variant key (for uniqueness)
      const variantKey = is_variant && variantId
        ? `${productId}_${variantId}`
        : `${productId}_default`;

      // Check for existing cart item
      const existingItem = await Cart.findOne({
        customer_id: userId,
        variant_key: variantKey,
      });

      if (existingItem) {
        if (existingItem.save_for_later === true) {
          await Cart.deleteOne({ _id: existingItem._id });
        } else {
          return res.status(400).json({
            status: false,
            message: "Product already in cart.",
          });
        }
      }

      if (quantity > stock) {
        return res.status(400).json({
          status: false,
          message: `Only ${stock} units available in stock`,
        });
      }

      const cartItem = await Cart.create({
        customer_id: userId,
        product_id: productId,
        variant_id: is_variant ? variantId : null,
        is_variant: !!is_variant,
        selected_variant: selectedVariant,
        quantity,
        total_price: finalPrice,
        unit_price: finalPrice,
        name: product.name,
        tax: product.tax || 0,
        discount: product.discount,
        discount_type: product.discount_type,
        thumbnail: product.thumbnail,
        seller_id: product.seller_id,
        seller_is: product.added_by || "admin",
        variant_key: variantKey,
      });

      // Remove the product from wishlist if it exists
      // await Wishlist.deleteOne({
      //   userId: userId,
      //   productId: productId,
      //   variantValues: selectedVariant && Object.keys(selectedVariant).length > 0 ? selectedVariant : null,
      // });

      res.json({
        status: true,
        message: "Product added to cart",
        data: cartItem,
      });
    } catch (error) {
      console.error("Add to cart error:", error);
      res.status(500).json({ status: false, message: error.message });
    }
  },
  async removeFromCart(req, res) {
    const userId = req.user?.id;
    const { productId, variantId, is_variant } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ status: false, message: "userId and productId required" });
    }

    try {
      await Cart.findOneAndDelete({
        customer_id: userId,
        product_id: productId,
        variant_id: is_variant ? variantId : null,
        is_variant: !!is_variant,
      });

      res.json({
        status: true,
        message: "Removed from cart",
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
  async updateQuantity(req, res) {
    const userId = req.user?.id;
    const { productId, variantId, is_variant, quantity } = req.body;

    if (!userId || !productId || quantity === undefined) {
      return res.status(400).json({
        status: false,
        message: "userId, productId, and quantity are required",
      });
    }

    if (quantity < 1) {
      return res
        .status(400)
        .json({ status: false, message: "Quantity must be at least 1" });
    }

    try {
      const updated = await Cart.findOneAndUpdate(
        {
          customer_id: userId,
          product_id: productId,
        },
        { $set: { quantity: quantity } },
        { new: true }
      );

      if (!updated) {
        return res
          .status(404)
          .json({ status: false, message: "Cart item not found" });
      }

      res.json({
        status: true,
        message: "Quantity updated",
        data: updated,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
  async clearCart(req, res) {
    // const userId = req.params.userId;
    const userId = req.user?.id;

    try {
      await Cart.deleteMany({ customer_id: userId });
      res.json({
        status: true,
        message: "Cart cleared",
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
  async increaseQuantity(req, res) {
    const userId = req.user?.id;
    const { productId, variantId, is_variant } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        status: false,
        message: "userId and productId are required",
      });
    }

    try {
      const query = {
        customer_id: userId,
        product_id: productId,
      };

      if (is_variant && variantId) {
        query.variant_id = variantId;
        query.is_variant = true;
      } else {
        query.is_variant = false;
      }

      const cartItem = await Cart.findOne(query);
      if (!cartItem) {
        return res.status(404).json({
          status: false,
          message: "Cart item not found",
        });
      }

      // Fetch product/variant stock to check availability
      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ status: false, message: "Product not found" });
      }

      let availableStock = product.current_stock;
      if (is_variant && variantId) {
        const variant = await VariantOption.findOne({
          _id: variantId,
          product_id: productId,
        });

        if (!variant) {
          return res
            .status(404)
            .json({ status: false, message: "Variant not found" });
        }

        availableStock = variant.stock;

      }

      if (cartItem.quantity + 1 > availableStock) {
        return res.status(400).json({
          status: false,
          message: "Cannot increase quantity. Stock limit reached.",
        });
      }

      // Update quantity
      const updated = await Cart.findOneAndUpdate(
        query,
        { $inc: { quantity: 1 } },
        { new: true }
      );

      res.json({
        status: true,
        message: "Quantity increased",
        data: updated,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
  async decreaseQuantity(req, res) {
    const userId = req.user?.id;
    const { productId, variantId, is_variant } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        status: false,
        message: "userId and productId are required",
      });
    }

    try {
      const query = {
        customer_id: userId,
        product_id: productId,
      };

      if (is_variant && variantId) {
        query.variant_id = variantId;
        query.is_variant = true;
      } else {
        query.is_variant = false;
      }

      const cartItem = await Cart.findOne(query);

      if (!cartItem) {
        return res.status(404).json({
          status: false,
          message: "Cart item not found",
        });
      }

      if (cartItem.quantity <= 1) {
        await cartItem.deleteOne();
        return res.json({
          status: true,
          message: "Item removed from cart",
        });
      }

      await Cart.updateOne({ _id: cartItem._id }, { $inc: { quantity: -1 } });

      const updatedCartItem = await Cart.findById(cartItem._id);
      res.json({
        status: true,
        message: "Quantity decreased",
        data: updatedCartItem,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
  async toggleSaveForLater(req, res) {
    const userId = req.user?.id;
    const { productId, variantId, is_variant, saveForLater } = req.body;

    if (!userId || !productId || typeof saveForLater !== "boolean") {
      return res.status(400).json({
        status: false,
        message: "userId, productId, and saveForLater are required",
      });
    }

    try {
      const query = {
        customer_id: userId,
        product_id: productId,
      };

      const cartItem = await Cart.findOneAndUpdate(
        query,
        { $set: { save_for_later: saveForLater } },
        { new: true }
      );

      if (!cartItem) {
        return res
          .status(404)
          .json({ status: false, message: "Cart item not found" });
      }

      res.json({
        status: true,
        message: "Save for later toggled",
        data: cartItem,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
  async toggleMoveToCart(req, res) {
    const userId = req.user?.id;
    const { productId, variantId, is_variant, saveForLater } = req.body;

    if (!userId || !productId || typeof saveForLater !== "boolean") {
      return res.status(400).json({
        status: false,
        message: "userId, productId, and saveForLater are required",
      });
    }

    try {
      const query = {
        customer_id: userId,
        product_id: productId,
      };

      if (is_variant && variantId) {
        query.variant_id = variantId;
        query.is_variant = true;
      } else {
        query.is_variant = false;
      }

      const cartItem = await Cart.findOneAndUpdate(
        query,
        { $set: { save_for_later: saveForLater } },
        { new: true }
      );

      if (!cartItem) {
        return res
          .status(404)
          .json({ status: false, message: "Cart item not found" });
      }

      res.json({
        status: true,
        message: saveForLater ? "Moved to save for later" : "Moved to cart",
        data: cartItem,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
  async getSavedForLater(req, res) {
    const userId = req.user?.id;

    try {
      const savedItems = await Cart.find({
        customer_id: userId,
        save_for_later: true,
      });

      res.json({
        status: true,
        message: "Saved items fetched successfully",
        data: savedItems,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
  async cartCount(req, res) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "userId is required",
      });
    }
    try {
      const count = await Cart.countDocuments({
        customer_id: userId,
        save_for_later: false,
      });
      res.json({
        status: true,
        message: "Cart count fetched successfully",
        data: { count },
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
};
