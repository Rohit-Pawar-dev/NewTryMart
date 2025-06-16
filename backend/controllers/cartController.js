const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Helper to calculate price with discount, tax etc.
async function calculatePrice(productId, selectedVariant = {}) {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  let basePrice = product.unit_price;
  let discountAmount = 0;
  if (product.discount_type === "percent") {
    discountAmount = (product.discount / 100) * basePrice;
  } else {
    discountAmount = product.discount;
  }
  discountAmount = Math.min(discountAmount, basePrice);
  let priceAfterDiscount = basePrice - discountAmount;

  // Example tax: 10%
  const taxRate = 0.1;
  const taxAmount = priceAfterDiscount * taxRate;

  const finalPrice = priceAfterDiscount + taxAmount;

  return {
    basePrice,
    discountAmount,
    taxAmount,
    finalPrice,
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

      for (const item of cartItems) {
        // Use calculatePrice for each item
        const { discountAmount, taxAmount } = await calculatePrice(item.product_id, item.selected_variant);
        totalDiscount += discountAmount * item.quantity;
        totalTax += taxAmount * item.quantity;
        totalAmount += (item.total_price * item.quantity);
      }

      res.json({
        status: true,
        message: "Cart fetched successfully",
        data: {
          cartItems,
          totalAmount,
          totalDiscount,
          totalTax,
        },
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  // Add to cart or update quantity if already exists
  async addToCart(req, res) {
    const { userId, productId, selectedVariant } = req.body;
    const quantity = req.body.quantity || 1;
    if (!userId || !productId) {
      return res.status(400).json({ status: false, message: "userId and productId required" });
    }

    try {
      const priceData = await calculatePrice(productId, selectedVariant);
      const product = await Product.findById(productId);

      // Upsert cart item: if exists, increment quantity
      const cartItem = await Cart.findOneAndUpdate(
        {
          customer_id: userId,
          product_id: productId,
          selected_variant: selectedVariant || {},
        },
        {
          $inc: { quantity: quantity },
          $setOnInsert: {
            name : product.name,
            total_price: priceData.finalPrice,
            unit_price: product.unit_price,
            discount: product.discount,
            discount_type: product.discount_type,
            customer_id: userId,
            product_id: productId,
            selected_variant: selectedVariant || {},
          },
        },
        { upsert: true, new: true }
      );

      res.json({
        status: true,
        message: "Item added/updated in cart",
        data: cartItem,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  // Remove a product from cart
  async removeFromCart(req, res) {
    const { userId, productId, selectedVariant } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ status: false, message: "userId and productId required" });
    }

    try {
      await Cart.findOneAndDelete({
        customer_id: userId,
        product_id: productId,
        selected_variant: selectedVariant || {},
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
    const { userId, productId, quantity, selectedVariant } = req.body;

    if (!userId || !productId || quantity === undefined) {
      return res.status(400).json({ status: false, message: "userId, productId, and quantity required" });
    }

    if (quantity < 1) {
      return res.status(400).json({ status: false, message: "Quantity must be at least 1" });
    }

    try {
      const updated = await Cart.findOneAndUpdate(
        {
          customer_id: userId,
          product_id: productId,
          selected_variant: selectedVariant || {},
        },
        { $set: { quantity: quantity } },
        { new: true }
      );

      if (!updated)
        return res.status(404).json({ status: false, message: "Cart item not found" });

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
    const { userId, productId, selectedVariant } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ status: false, message: "userId and productId required" });
    }

    try {
      const updated = await Cart.findOneAndUpdate(
        {
          customer_id: userId,
          product_id: productId,
          selected_variant: selectedVariant || {},
        },
        { $inc: { quantity: 1 } },
        { new: true }
      );

      if (!updated)
        return res.status(404).json({ status: false, message: "Cart item not found" });

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
    const { userId, productId, selectedVariant } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ status: false, message: "userId and productId required" });
    }

    try {
      const cartItem = await Cart.findOne({
        customer_id: userId,
        product_id: productId,
        selected_variant: selectedVariant || {},
      });

      if (!cartItem)
        return res.status(404).json({ status: false, message: "Cart item not found" });

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
    const { userId, productId, selectedVariant, saveForLater } = req.body;

    if (!userId || !productId || typeof saveForLater !== "boolean") {
      return res.status(400).json({
        status: false,
        message: "userId, productId, and saveForLater are required",
      });
    }

    try {
      const cartItem = await Cart.findOneAndUpdate(
        {
          customer_id: userId,
          product_id: productId,
          selected_variant: selectedVariant || {},
        },
        { $set: { save_for_later: saveForLater } },
        { new: true }
      );

      if (!cartItem) {
        return res.status(404).json({ status: false, message: "Cart item not found" });
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
    const { userId, productId, selectedVariant, saveForLater } = req.body;

    if (!userId || !productId || typeof saveForLater !== "boolean") {
      return res.status(400).json({
        status: false,
        message: "userId, productId, and saveForLater are required",
      });
    }

    try {
      const cartItem = await Cart.findOneAndUpdate(
        {
          customer_id: userId,
          product_id: productId,
          selected_variant: selectedVariant || {},
        },
        { $set: { save_for_later: saveForLater } },
        { new: false }
      );

      if (!cartItem) {
        return res.status(404).json({ status: false, message: "Cart item not found" });
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
