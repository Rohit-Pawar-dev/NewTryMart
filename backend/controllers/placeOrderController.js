const Cart = require("../models/Cart");
const OrderItemDetail = require("../models/OrderDetails");
const Order = require("../models/Order");
const Product = require("../models/Product"); 

async function placeOrder(req, res) {
  try {
    const userId = req.user?._id || "684d01a167bc70037c94af6a";
    const shippingAddressId = req.body.address_id;

    // 1. Fetch all cart items for this user and populate product & seller info
    const cartItems = await Cart.find({ customer_id: userId })
      .populate('product_id')  // populate product details
      .populate('seller_id');  // populate seller details

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalOrderPrice = 0;
    const orderItemIds = [];

    // Validate stock availability first
    for (const item of cartItems) {
      const product = item.product_id;

      if (!product) {
        return res.status(400).json({ message: `Product not found for cart item ${item._id}` });
      }

      if (product.current_stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ${product.name}. Available: ${product.current_stock}, Requested: ${item.quantity}`,
        });
      }
    }

    // All stock validated, now create order items and update stock
    for (const item of cartItems) {
      const product = item.product_id;
      const seller = item.seller_id;

      const itemTotalPrice = item.total_price + (item.shipping_cost || 0);

      // Create OrderItemDetail document
      const orderItem = new OrderItemDetail({
        product_id: product._id,
        product_detail: product._id, // or full product info if needed
        name: product.name,
        thumbnail: product.thumbnail,
        selected_variant: item.selected_variant,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: itemTotalPrice,
        tax: item.tax,
        discount: item.discount,
        discount_type: item.discount_type,
        tax_model: item.tax_model,
        slug: item.slug,
        seller_id: seller ? seller._id : null,
        shipping_cost: item.shipping_cost,
        shipping_type: item.shipping_type,
        shipping_address: shippingAddressId,
        delivery_status: "Pending",
        added_by: item.added_by,
      });

      await orderItem.save();
      orderItemIds.push(orderItem._id);

      totalOrderPrice += itemTotalPrice;

      // Deduct stock from product
      product.current_stock -= item.quantity;
      await product.save();
    }

    // Create the Order document
    const order = new Order({
      customer_id: userId,
      order_items: orderItemIds,
      shipping_address: shippingAddressId,
      total_price: totalOrderPrice,
      status: "Pending",
      payment_status: "Unpaid",
      payment_method: req.body.payment_method || "COD",
    });

    await order.save();

    // Clear the cart for this user
    await Cart.deleteMany({ customer_id: userId });

    // Return success response
    return res.status(201).json({
      message: "Order placed successfully",
      order_id: order._id,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { placeOrder };
