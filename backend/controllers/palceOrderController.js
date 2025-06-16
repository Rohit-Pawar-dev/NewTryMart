const Cart = require("../models/Cart");
const OrderItemDetail = require("../models/OrderItemDetail");
const Order = require("../models/Order");

// Assuming req.user._id is authenticated user id
// req.body.address_id is the shipping address user selected

async function placeOrder(req, res) {
  try {
    const userId = req.user._id;
    const shippingAddressId = req.body.address_id;

    // 1. Fetch all cart items for this user
    const cartItems = await Cart.find({ customer_id: userId });
    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 2. Create OrderItemDetail docs for each cart item
    let totalOrderPrice = 0;
    const orderItemIds = [];

    for (const item of cartItems) {
      // Calculate total price for this item (you can customize logic here)
      const itemTotalPrice = item.total_price + (item.shipping_cost || 0);

      // Create OrderItemDetail document
      const orderItem = new OrderItemDetail({
        product_id: item.product_id,
        product_detail: item.product_id,
        name: item.name,
        thumbnail: item.thumbnail,
        selected_variant: item.selected_variant,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: itemTotalPrice,
        tax: item.tax,
        discount: item.discount,
        discount_type: item.discount_type,
        tax_model: item.tax_model,
        slug: item.slug,
        seller_id: item.seller_id,
        shipping_cost: item.shipping_cost,
        shipping_type: item.shipping_type,
        shipping_address: shippingAddressId,
        delivery_status: "Pending",
        added_by: item.added_by,
      });

      await orderItem.save();
      orderItemIds.push(orderItem._id);

      totalOrderPrice += itemTotalPrice;
    }

    // 3. Create the Order document
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

    // 4. Clear the cart for this user
    await Cart.deleteMany({ customer_id: userId });

    // 5. Return success response
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
