const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Helper to calculate price with discount, tax etc.
async function calculatePrice(productId, selectedVariant = {}) {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  // Basic discount calculation
  let price = product.unit_price;
  if (product.discount_type === "percent") {
    price -= (product.discount / 100) * price;
  } else {
    price -= product.discount;
  }
  price = Math.max(price, 0);

  // Tax could be applied here as well
  // For demo, skipping tax calculations

  return price;
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
      const totalAmount = cartItems.reduce((total, item) => {
        // You can adjust this to include tax or discount if you want
        return total + item.total_price * item.quantity;
      }, 0);
      res.json({
        cartItems,
        totalAmount,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Add to cart or update quantity if already exists
  async addToCart(req, res) {
    const { userId, productId, selectedVariant } = req.body;
    const quantity = req.body.quantity || 1;
    if (!userId || !productId ) {
      return res
        .status(400)
        .json({ error: "userId and productId required" });
    }

    try {
      const price = await calculatePrice(productId, selectedVariant);
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
          total_price:  price,
            unit_price:product.unit_price,
            discount:product.discount,
            discount_type:product.discount_type,
            customer_id: userId,
            product_id: productId,
            selected_variant: selectedVariant || {},
          },
        },
        { upsert: true, new: true }
      );

      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Remove a product from cart
  async removeFromCart(req, res) {
    const { userId, productId, selectedVariant } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "userId and productId required" });
    }

    try {
      await Cart.findOneAndDelete({
        customer_id: userId,
        product_id: productId,
        selected_variant: selectedVariant || {},
      });
      res.json({ message: "Removed from cart" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update quantity for a cart item
  async updateQuantity(req, res) {
    const { userId, productId, quantity, selectedVariant } = req.body;

    if (!userId || !productId || quantity === undefined) {
      return res
        .status(400)
        .json({ error: "userId, productId, and quantity required" });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
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
        return res.status(404).json({ error: "Cart item not found" });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Clear cart for a user
  async clearCart(req, res) {
    const userId = req.params.userId;

    try {
      await Cart.deleteMany({ customer_id: userId });
      res.json({ message: "Cart cleared" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  // 👇 Increase quantity (+)
  async increaseQuantity(req, res) {
    const { userId, productId, selectedVariant } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "userId and productId required" });
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
        return res.status(404).json({ error: "Cart item not found" });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 👇 Decrease quantity (–)
  async decreaseQuantity(req, res) {
    const { userId, productId, selectedVariant } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "userId and productId required" });
    }

    try {
      const cartItem = await Cart.findOne({
        customer_id: userId,
        product_id: productId,
        selected_variant: selectedVariant || {},
      });

      if (!cartItem)
        return res.status(404).json({ error: "Cart item not found" });

      if (cartItem.quantity <= 1) {
        await cartItem.deleteOne();
        return res.json({ message: "Item removed from cart" });
      }

      // Direct update instead of modifying the document and calling `save()`
      await Cart.updateOne({ _id: cartItem._id }, { $inc: { quantity: -1 } });

      const updatedCartItem = await Cart.findById(cartItem._id);
      res.json(updatedCartItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async toggleSaveForLater(req, res) {
    const { userId, productId, selectedVariant, saveForLater } = req.body;

    if (!userId || !productId || typeof saveForLater !== "boolean") {
      return res
        .status(400)
        .json({ error: "userId, productId, and saveForLater are required" });
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
        return res.status(404).json({ error: "Cart item not found" });
      }

      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
   async toggleMoveToCart(req, res) {
    const { userId, productId, selectedVariant, saveForLater } = req.body;

    if (!userId || !productId || typeof saveForLater !== "boolean") {
      return res
        .status(400)
        .json({ error: "userId, productId, and saveForLater are required" });
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
        return res.status(404).json({ error: "Cart item not found" });
      }

      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getSavedForLater(req, res) {
    const userId = req.params.userId;

    try {
      const savedItems = await Cart.find({
        customer_id: userId,
        save_for_later: true,
      });

      res.json(savedItems);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
