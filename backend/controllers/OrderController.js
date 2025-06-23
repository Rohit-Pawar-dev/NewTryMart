const Cart = require("../models/Cart");
const OrderItemDetail = require("../models/OrderDetails");
const Order = require("../models/Order");
const Product = require("../models/Product");
const VariantOption = require("../models/VariantOption");
const User = require("../models/User");
const Seller = require("../models/Seller");
const nlogger = require("../logger");

async function placeOrder(req, res) {
  try {
    const userId = req.body.user_id;
    const shippingAddressId = req.body.address_id;

    // Fetch cart items and populate necessary fields
    const cartItems = await Cart.find({ customer_id: userId })
      .populate("product_id")
      .populate("seller_id");

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Step 1: Validate Stock
    for (const item of cartItems) {
      const product = item.product_id;
      if (!product) {
        return res
          .status(400)
          .json({ message: `Product not found for cart item ${item._id}` });
      }

      if (item.is_variant && item.variant_id) {
        const variant = await VariantOption.findOne({
          _id: item.variant_id,
          product_id: product._id,
        });

        if (!variant || variant.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for variant of product ${product.name}`,
          });
        }
      } else if (product.current_stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for product ${product.name}` });
      }
    }

    // Step 2: Group cart items by seller_id (or 'admin')
    console.log("Item:", cartItems);
    const groupedItems = {};
    for (const item of cartItems) {
      const sellerKey =
        item.added_by === "admin" ? "admin" : item.seller_id?._id?.toString();
      if (!groupedItems[sellerKey]) groupedItems[sellerKey] = [];
      groupedItems[sellerKey].push(item);
    }

    const orderResults = [];

    // Step 3: Create order per seller
    for (const [sellerKey, items] of Object.entries(groupedItems)) {
      let totalOrderPrice = 0;
      const orderItemIds = [];

      for (const item of items) {
        const product = item.product_id;
        const seller = item.seller_id;

        const itemTotalPrice = item.total_price + (item.shipping_cost || 0);
        totalOrderPrice += itemTotalPrice;

        const productSnapshot = product.toObject();
        delete productSnapshot.__v;
        delete productSnapshot.createdAt;
        delete productSnapshot.updatedAt;

        // Determine seller_id safely
        const sellerId =
          sellerKey === "admin" ? null : items[0]?.seller_id?._id || null;

        const orderItem = new OrderItemDetail({
          product_id: product._id,
          product_detail: productSnapshot,
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
          seller_id: sellerId,
          seller_is: sellerKey === "admin" ? "admin" : "seller",
          shipping_cost: item.shipping_cost,
          shipping_type: item.shipping_type,
          shipping_address: shippingAddressId,
          delivery_status: "Pending",
        });

        await orderItem.save();
        orderItemIds.push(orderItem._id);

        // Deduct stock
        if (item.is_variant && item.variant_id) {
          await VariantOption.findOneAndUpdate(
            { _id: item.variant_id, product_id: product._id },
            { $inc: { stock: -item.quantity } }
          );
        } else {
          product.current_stock -= item.quantity;
          await product.save();
        }
      }

      // Coupon (if any)
      const couponItem = items.find(
        (item) => item.coupon_code && item.coupon_amount
      );
      let couponCode = null;
      let couponAmount = 0;
      if (couponItem) {
        couponCode = couponItem.coupon_code;
        couponAmount = couponItem.coupon_amount || 0;
        totalOrderPrice = Math.max(0, totalOrderPrice - couponAmount);
      }

      const order = new Order({
        customer_id: userId,
        order_items: orderItemIds,
        shipping_address: shippingAddressId,
        total_price: totalOrderPrice,
        status: "Pending",
        payment_status: "Unpaid",
        payment_method: req.body.payment_method || "COD",
        coupon_code: couponCode,
        coupon_amount: couponAmount,
        seller_id: sellerKey === "admin" ? null : items[0].seller_id?._id,
        seller_is: sellerKey === "admin" ? "admin" : "seller",
      });

      await order.save();
      orderResults.push(order._id);

      await OrderItemDetail.updateMany(
        { _id: { $in: orderItemIds } },
        { order_id: order._id }
      );
    }

    // Clear cart
    await Cart.deleteMany({ customer_id: userId });

    return res.status(201).json({
      message: "Orders placed successfully",
      order_ids: orderResults,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Admin Order Listing (with search + pagination)
async function getOrders(req, res) {
  try {
    const searchText = req.query.search ?? "";
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const userFilter = {
      $or: [
        { name: { $regex: searchText, $options: "i" } },
        { mobile: { $regex: searchText, $options: "i" } },
      ],
    };

    const matchingUsers = await User.find(userFilter).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    const filter = searchText ? { customer_id: { $in: userIds } } : {};

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate("customer_id", "name mobile email profilePicture")
      .populate("order_items")
      .populate("seller_id")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      status: true,
      message: "Orders fetched successfully",
      data: orders,
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    nlogger.error("Error retrieving orders", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

// Get Single Order by ID
async function getOrderById(req, res) {
  try {
    let order = await Order.findById(req.params.id)
      .populate("customer_id", "name email mobile profilePicture")
      .populate("seller_id", "shop_name mobile email")
      .populate("shipping_address")
      .populate({
        path: "order_items",
        populate: {
          path: "product_id",
          select: "name thumbnail",
        },
      });

    if (!order) {
      return res
        .status(404)
        .json({ status: false, message: "Order not found" });
    }

    // 👇 Convert to plain object to append custom data
    order = order.toObject();

    // 👇 Count total orders by the same customer
    const orderCount = await Order.countDocuments({
      customer_id: order.customer_id._id,
    });

    // 👇 Attach order count
    order.customer_order_count = orderCount;

    return res.status(200).json({
      status: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (err) {
    console.error("Error fetching order by ID", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

module.exports = {
  placeOrder,
  getOrders,
  getOrderById,
};
