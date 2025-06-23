const Cart = require("../models/Cart");
const Product = require("../models/Product");
const VariantOption = require("../models/VariantOption");
const mongoose = require("mongoose");

// Helper to calculate price with discount, tax etc.
async function calculatePrice(productId, variantId = null, isVariant = false) {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  let basePrice = product.unit_price;
  let stock = product.current_stock;

  if (isVariant && variantId) {
    const variation = product.variation_options.find(
      (v) => v._id.toString() === variantId
    );
    if (!variation) throw new Error("Variant not found");

    basePrice = variation.price;
    stock = variation.stock;
  }

  let discountAmount = 0;
  if (product.discount_type === "percent") {
    discountAmount = (product.discount / 100) * basePrice;
  } else {
    discountAmount = product.discount;
  }
  discountAmount = Math.min(discountAmount, basePrice);

  const priceAfterDiscount = basePrice - discountAmount;
  const taxAmount = (product.tax / 100) * priceAfterDiscount;
  const finalPrice = priceAfterDiscount + taxAmount;

  return {
    basePrice,
    discountAmount,
    taxAmount,
    finalPrice,
    stock,
  };
}

module.exports = {
  // Get all cart items for a user
  async getCart(req, res) {
    const userId = req.params.userId;

    try {
      const cartItems = await Cart.find({
        customer_id: userId,
        save_for_later: false,
      });

      let totalAmount = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      let couponAmount = 0;
      let couponCode = null;

      const updatedCart = [];

      for (const item of cartItems) {
        let basePrice,
          discountAmount = 0,
          taxAmount = 0,
          finalPrice = 0;
        let variant = null;

        const product = await Product.findById(item.product_id);

        if (!product) continue;

        console.log("test", item.is_variant && item.variant_id);
        if (item.is_variant && item.variant_id) {
          variant = await VariantOption.findOne({
            _id: item.variant_id,
            product_id: item.product_id,
          });

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

        // Extract coupon info (assuming it's stored on each cart item)
        if (item.coupon_code && item.coupon_amount && couponAmount === 0) {
          couponAmount = item.coupon_amount;
          couponCode = item.coupon_code;
        }

        updatedCart.push({
          ...item._doc,
          variant,
          product_name: product.name,
          thumbnail: product.thumbnail,
          final_price: finalPrice,
        });
      }

      // Subtract coupon amount once at the end
      const finalTotalAmount = Math.max(0, totalAmount - couponAmount);

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
        },
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
  // Add to cart or update quantity if already exists
  async addToCart(req, res) {
    const { userId, productId, variantId, is_variant, quantity = 1 } = req.body;

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

      // Variant logic
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
          variant.options && Object.keys(variant.options).length > 0
            ? variant.options
            : null;
      }

      // Enforce single cart item per customer-product
      const existingItem = await Cart.findOne({
        customer_id: userId,
        product_id: productId,
      });

      if (existingItem) {
        if (existingItem.save_for_later === true) {
          // Allow replacing save-for-later
          await Cart.deleteOne({ _id: existingItem._id });
        } else {
          return res.status(400).json({
            status: false,
            message: "Product already in cart. Update quantity instead.",
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
      });

      res.json({
        status: true,
        message: "Product added to cart",
        data: cartItem,
      });
    } catch (error) {
      console.error("Add to cart error:", error); // helpful for debugging
      res.status(500).json({ status: false, message: error.message });
    }
  },

  // Remove a product from cart
  async removeFromCart(req, res) {
    const { userId, productId, variantId, is_variant } = req.body;

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

  // Update quantity for a cart item
  async updateQuantity(req, res) {
    const { userId, productId, variantId, is_variant, quantity } = req.body;

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

  // Clear cart for a user
  async clearCart(req, res) {
    const userId = req.params.userId;

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

  // Increase quantity (+)
  async increaseQuantity(req, res) {
    const { userId, productId, variantId, is_variant } = req.body;

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
        const variant = product.variation_options.find(
          (v) => v._id.toString() === variantId
        );
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

  // Decrease quantity (–)
  async decreaseQuantity(req, res) {
    const { userId, productId, variantId, is_variant } = req.body;

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
    const { userId, productId, variantId, is_variant, saveForLater } = req.body;

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
    const { userId, productId, variantId, is_variant, saveForLater } = req.body;

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
    const userId = req.params.userId;

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
};

// const Cart = require("../models/Cart");
// const Product = require("../models/Product");

// // Helper to calculate price with discount, tax etc.
// async function calculatePrice(productId, selectedVariant = {}) {
//   const product = await Product.findById(productId);
//   if (!product) throw new Error("Product not found");

//   let basePrice = product.unit_price;
//   let discountAmount = 0;
//   if (product.discount_type === "percent") {
//     discountAmount = (product.discount / 100) * basePrice;
//   } else {
//     discountAmount = product.discount;
//   }
//   discountAmount = Math.min(discountAmount, basePrice);
//   let priceAfterDiscount = basePrice - discountAmount;

//   // Example tax: 10%
//   const taxRate = 0.1;
//   const taxAmount = priceAfterDiscount * taxRate;

//   const finalPrice = priceAfterDiscount + taxAmount;

//   return {
//     basePrice,
//     discountAmount,
//     taxAmount,
//     finalPrice,
//   };
// }

// module.exports = {
//   // Get all cart items for a user
//   async getCart(req, res) {
//     const userId = req.params.userId;

//     try {
//       const cartItems = await Cart.find({
//         customer_id: userId,
//         save_for_later: false,
//       });

//       let totalAmount = 0;
//       let totalDiscount = 0;
//       let totalTax = 0;

//       for (const item of cartItems) {
//         // Use calculatePrice for each item
//         const { discountAmount, taxAmount } = await calculatePrice(item.product_id, item.selected_variant);
//         totalDiscount += discountAmount * item.quantity;
//         totalTax += taxAmount * item.quantity;
//         totalAmount += (item.total_price * item.quantity);
//       }

//       res.json({
//         status: true,
//         message: "Cart fetched successfully",
//         data: {
//           cartItems,
//           totalAmount,
//           totalDiscount,
//           totalTax,
//         },
//       });
//     } catch (error) {
//       res.status(500).json({ status: false, message: error.message });
//     }
//   },

//   // Add to cart or update quantity if already exists
//   async addToCart(req, res) {
//     const { userId, productId, selectedVariant } = req.body;
//     const quantity = req.body.quantity || 1;
//     if (!userId || !productId) {
//       return res.status(400).json({ status: false, message: "userId and productId required" });
//     }

//     try {
//       const priceData = await calculatePrice(productId, selectedVariant);
//       const product = await Product.findById(productId);

//       // Upsert cart item: if exists, increment quantity
//       const cartItem = await Cart.findOneAndUpdate(
//         {
//           customer_id: userId,
//           product_id: productId,
//           selected_variant: selectedVariant || {},
//         },
//         {
//           $inc: { quantity: quantity },
//           $setOnInsert: {
//             name : product.name,
//             total_price: priceData.finalPrice,
//             unit_price: product.unit_price,
//             discount: product.discount,
//             discount_type: product.discount_type,
//             customer_id: userId,
//             product_id: productId,
//             selected_variant: selectedVariant || {},
//           },
//         },
//         { upsert: true, new: true }
//       );

//       res.json({
//         status: true,
//         message: "Item added/updated in cart",
//         data: cartItem,
//       });
//     } catch (error) {
//       res.status(500).json({ status: false, message: error.message });
//     }
//   },

//   // Remove a product from cart
//   async removeFromCart(req, res) {
//     const { userId, productId, selectedVariant } = req.body;

//     if (!userId || !productId) {
//       return res.status(400).json({ status: false, message: "userId and productId required" });
//     }

//     try {
//       await Cart.findOneAndDelete({
//         customer_id: userId,
//         product_id: productId,
//         selected_variant: selectedVariant || {},
//       });
//       res.json({
//         status: true,
//         message: "Removed from cart",
//       });
//     } catch (error) {
//       res.status(500).json({ status: false, message: error.message });
//     }
//   },

//   // Update quantity for a cart item
//   async updateQuantity(req, res) {
//     const { userId, productId, quantity, selectedVariant } = req.body;

//     if (!userId || !productId || quantity === undefined) {
//       return res.status(400).json({ status: false, message: "userId, productId, and quantity required" });
//     }

//     if (quantity < 1) {
//       return res.status(400).json({ status: false, message: "Quantity must be at least 1" });
//     }

//     try {
//       const updated = await Cart.findOneAndUpdate(
//         {
//           customer_id: userId,
//           product_id: productId,
//           selected_variant: selectedVariant || {},
//         },
//         { $set: { quantity: quantity } },
//         { new: true }
//       );

//       if (!updated)
//         return res.status(404).json({ status: false, message: "Cart item not found" });

//       res.json({
//         status: true,
//         message: "Quantity updated",
//         data: updated,
//       });
//     } catch (error) {
//       res.status(500).json({ status: false, message: error.message });
//     }
//   },

//   // Clear cart for a user
//   async clearCart(req, res) {
//     const userId = req.params.userId;

//     try {
//       await Cart.deleteMany({ customer_id: userId });
//       res.json({
//         status: true,
//         message: "Cart cleared",
//       });
//     } catch (error) {
//       res.status(500).json({ status: false, message: error.message });
//     }
//   },

//   // Increase quantity (+)
//   async increaseQuantity(req, res) {
//     const { userId, productId, selectedVariant } = req.body;

//     if (!userId || !productId) {
//       return res.status(400).json({ status: false, message: "userId and productId required" });
//     }

//     try {
//       const updated = await Cart.findOneAndUpdate(
//         {
//           customer_id: userId,
//           product_id: productId,
//           selected_variant: selectedVariant || {},
//         },
//         { $inc: { quantity: 1 } },
//         { new: true }
//       );

//       if (!updated)
//         return res.status(404).json({ status: false, message: "Cart item not found" });

//       res.json({
//         status: true,
//         message: "Quantity increased",
//         data: updated,
//       });
//     } catch (error) {
//       res.status(500).json({ status: false, message: error.message });
//     }
//   },

//   // Decrease quantity (–)
//   async decreaseQuantity(req, res) {
//     const { userId, productId, selectedVariant } = req.body;

//     if (!userId || !productId) {
//       return res.status(400).json({ status: false, message: "userId and productId required" });
//     }

//     try {
//       const cartItem = await Cart.findOne({
//         customer_id: userId,
//         product_id: productId,
//         selected_variant: selectedVariant || {},
//       });

//       if (!cartItem)
//         return res.status(404).json({ status: false, message: "Cart item not found" });

//       if (cartItem.quantity <= 1) {
//         await cartItem.deleteOne();
//         return res.json({
//           status: true,
//           message: "Item removed from cart",
//         });
//       }

//       await Cart.updateOne({ _id: cartItem._id }, { $inc: { quantity: -1 } });

//       const updatedCartItem = await Cart.findById(cartItem._id);
//       res.json({
//         status: true,
//         message: "Quantity decreased",
//         data: updatedCartItem,
//       });
//     } catch (error) {
//       res.status(500).json({ status: false, message: error.message });
//     }
//   },

//   async toggleSaveForLater(req, res) {
//     const { userId, productId, selectedVariant, saveForLater } = req.body;

//     if (!userId || !productId || typeof saveForLater !== "boolean") {
//       return res.status(400).json({
//         status: false,
//         message: "userId, productId, and saveForLater are required",
//       });
//     }

//     try {
//       const cartItem = await Cart.findOneAndUpdate(
//         {
//           customer_id: userId,
//           product_id: productId,
//           selected_variant: selectedVariant || {},
//         },
//         { $set: { save_for_later: saveForLater } },
//         { new: true }
//       );

//       if (!cartItem) {
//         return res.status(404).json({ status: false, message: "Cart item not found" });
//       }

//       res.json({
//         status: true,
//         message: "Save for later toggled",
//         data: cartItem,
//       });
//     } catch (error) {
//       res.status(500).json({ status: false, message: error.message });
//     }
//   },

//   async toggleMoveToCart(req, res) {
//     const { userId, productId, selectedVariant, saveForLater } = req.body;

//     if (!userId || !productId || typeof saveForLater !== "boolean") {
//       return res.status(400).json({
//         status: false,
//         message: "userId, productId, and saveForLater are required",
//       });
//     }

//     try {
//       const cartItem = await Cart.findOneAndUpdate(
//         {
//           customer_id: userId,
//           product_id: productId,
//           selected_variant: selectedVariant || {},
//         },
//         { $set: { save_for_later: saveForLater } },
//         { new: false }
//       );

//       if (!cartItem) {
//         return res.status(404).json({ status: false, message: "Cart item not found" });
//       }

//       res.json({
//         status: true,
//         message: saveForLater ? "Moved to save for later" : "Moved to cart",
//         data: cartItem,
//       });
//     } catch (error) {
//       res.status(500).json({ status: false, message: error.message });
//     }
//   },

//   async getSavedForLater(req, res) {
//     const userId = req.params.userId;

//     try {
//       const savedItems = await Cart.find({
//         customer_id: userId,
//         save_for_later: true,
//       });

//       res.json({
//         status: true,
//         message: "Saved items fetched successfully",
//         data: savedItems,
//       });
//     } catch (error) {
//       res.status(500).json({ status: false, message: error.message });
//     }
//   },
// };
