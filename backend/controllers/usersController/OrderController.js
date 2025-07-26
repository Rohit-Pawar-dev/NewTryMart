const Order = require("../../models/Order");
const OrderItemDetail = require("../../models/OrderDetails");
const VariantOption = require("../../models/VariantOption");
const Cart = require("../../models/Cart");
const Transaction = require("../../models/Transaction");
const WalletTransaction = require('../../models/WalletTransaction');
const User = require('../../models/User'); 
const Product = require("../../models/Product");
const axios = require("axios");
const Seller = require("../../models/Seller");
const Admin = require("../../models/Admin");
require('dotenv').config();


async function placeOrder(req, res) {
  try {
    const userId = req.body.user_id;
    const shippingAddressId = req.body.address_id;

    const cartItems = await Cart.find({ customer_id: userId, save_for_later: false })
      .populate("product_id")
      .populate("seller_id");

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const deliveryRes = await axios.get(`${process.env.BASE_URL}/users/business-setup/deliveryCharges`);
    const deliveryCharge = deliveryRes.data?.deliveryCharges || 0;

    const commissionRes = await axios.get(`${process.env.BASE_URL}/users/business-setup/seller-commission`);
    const commissionPercent = commissionRes.data?.sellerCommission || 0;

    const admin = await Admin.findOne();
    if (!admin) return res.status(500).json({ message: "Admin config missing" });

    // ✅ Validate stock
    for (const item of cartItems) {
      const product = item.product_id;
      if (!product) {
        return res.status(400).json({ message: `Product not found for cart item ${item._id}` });
      }

      if (item.is_variant && item.variant_id) {
        const variant = await VariantOption.findOne({ _id: item.variant_id, product_id: product._id });
        if (!variant || variant.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for variant of ${product.name}` });
        }
      } else if (product.current_stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
      }
    }

    // ✅ Group cart items
    const groupedItems = {};
    for (const item of cartItems) {
      let sellerKey;
      if (item.added_by === "admin" || !item.seller_id) {
        sellerKey = "admin";
      } else {
        sellerKey = item.seller_id._id.toString();
      }

      if (!groupedItems[sellerKey]) groupedItems[sellerKey] = [];
      groupedItems[sellerKey].push(item);
    }

    const orderResults = [];

    for (const [sellerKey, items] of Object.entries(groupedItems)) {
      let totalOrderPrice = 0;
      const orderItemIds = [];

      for (const item of items) {
        const product = item.product_id;
        const itemTotalPrice = item.total_price + (item.shipping_cost || 0);
        totalOrderPrice += itemTotalPrice;

        const productSnapshot = product.toObject();
        delete productSnapshot.__v;
        delete productSnapshot.createdAt;
        delete productSnapshot.updatedAt;

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
          seller_id: sellerKey === "admin" ? null : item.seller_id?._id || null,
          seller_is: sellerKey === "admin" ? "admin" : "seller",
          shipping_cost: item.shipping_cost,
          shipping_type: item.shipping_type,
          shipping_address: shippingAddressId,
          delivery_status: "Pending",
        });

        await orderItem.save();
        orderItemIds.push(orderItem._id);

        // ✅ Deduct stock
        if (item.is_variant && item.variant_id) {
          await VariantOption.updateOne(
            { _id: item.variant_id },
            { $inc: { stock: -item.quantity } }
          );
        } else {
          product.current_stock -= item.quantity;
          await product.save();
        }
      }

      // ✅ Apply coupon
      const couponItem = items.find(item => item.coupon_code && item.coupon_amount);
      let couponCode = null;
      let couponAmount = 0;
      if (couponItem) {
        couponCode = couponItem.coupon_code;
        couponAmount = couponItem.coupon_amount || 0;
        totalOrderPrice -= couponAmount;
      }

      // ✅ Add delivery charge
      totalOrderPrice += deliveryCharge;

      const latestOrder = await Order.findOne().sort({ order_id: -1 }).select("order_id").lean();
      const newOrderId = latestOrder?.order_id ? latestOrder.order_id + 1 : 100001;

      const order = new Order({
        customer_id: userId,
        order_id: newOrderId,
        order_items: orderItemIds,
        shipping_address: shippingAddressId,
        total_price: totalOrderPrice,
        delivery_charge: deliveryCharge,
        status: "Pending",
        payment_status: "Unpaid",
        payment_method: req.body.payment_method || "COD",
        coupon_code: couponCode,
        coupon_amount: couponAmount,
        seller_id: sellerKey === "admin" ? null : items[0].seller_id?._id || null,
        seller_is: sellerKey === "admin" ? "admin" : "seller",
      });

      await order.save();
      orderResults.push(order._id);

      await OrderItemDetail.updateMany({ _id: { $in: orderItemIds } }, { order_id: order._id });

      // ✅ Commission and Wallet Transfer
      const amountBeforeDelivery = totalOrderPrice - deliveryCharge;

      if (sellerKey === "admin") {
        admin.admin_wallet += amountBeforeDelivery;
      } else {
        const commission = (amountBeforeDelivery * commissionPercent) / 100;
        const sellerAmount = amountBeforeDelivery - commission;

        admin.seller_commission += commission;

        await Seller.findByIdAndUpdate(items[0].seller_id._id, {
          $inc: { seller_wallet: sellerAmount },
        });
      }

      // ✅ Transaction
      await new Transaction({
        order_id: order._id,
        user_id: userId,
        paid_by: userId,
        paid_to: sellerKey === "admin" ? null : items[0].seller_id?._id || null,
        amount: totalOrderPrice,
        payment_status: "Pending",
      }).save();
    }

    await admin.save(); // ✅ Save admin updates
    await Cart.deleteMany({ customer_id: userId, save_for_later: false });

    return res.status(201).json({
      message: "Orders placed successfully",
      order_ids: orderResults,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}




const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    // console.log("Fetching orders for user:", userId);

    const orders = await Order.find({ customer_id: userId })
      .populate({
        path: "order_items",
        populate: {
          path: "seller_id",
          select: "shop_name",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message: "User orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    console.error("Error fetching user orders:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

const getUserOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer_id: req.user.id,
    })
      .populate("customer_id", "name email mobile")
      .populate("shipping_address")
      .populate({
        path: "order_items",
        populate: [
          {
            path: "product_id",
            select: "name thumbnail",
          },
          {
            path: "seller_id",
            select: "shop_name",
          },
        ],
      });

    if (!order) {
      return res.status(404).json({
        status: false,
        message: "Order not found or unauthorized",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (err) {
    console.error("Error fetching order by ID:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

async function placeOrderOnline(req, res) {
  try {
    const userId = req.user.id;
    const shippingAddressId = req.body.address_id;

    const cartItems = await Cart.find({ customer_id: userId, save_for_later: false })
      .populate("product_id")
      .populate("seller_id");

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const deliveryRes = await axios.get(`${process.env.BASE_URL}/users/business-setup/deliveryCharges`);
    const deliveryCharge = deliveryRes.data?.deliveryCharges || 0;

    const commissionRes = await axios.get(`${process.env.BASE_URL}/users/business-setup/seller-commission`);
    const commissionPercent = commissionRes.data?.sellerCommission || 0;

    const admin = await Admin.findOne();
    if (!admin) return res.status(500).json({ message: "Admin config missing" });

    // ✅ Stock check
    for (const item of cartItems) {
      const product = item.product_id;
      if (!product) return res.status(400).json({ message: `Product not found for cart item ${item._id}` });

      if (item.is_variant && item.variant_id) {
        const variant = await VariantOption.findOne({ _id: item.variant_id, product_id: product._id });
        if (!variant || variant.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for variant of ${product.name}` });
        }
      } else if (product.current_stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
      }
    }

    // ✅ Group by seller
    const groupedItems = {};
    for (const item of cartItems) {
      const sellerKey = item.added_by === "admin" ? "admin" : item.seller_id?._id.toString();
      if (!groupedItems[sellerKey]) groupedItems[sellerKey] = [];
      groupedItems[sellerKey].push(item);
    }

    const orderResults = [];

    // ✅ Process each group
    for (const [sellerKey, items] of Object.entries(groupedItems)) {
      let totalOrderPrice = 0;
      const orderItemIds = [];

      for (const item of items) {
        const product = item.product_id;
        const itemTotal = item.total_price + (item.shipping_cost || 0);
        totalOrderPrice += itemTotal;

        const productSnapshot = product.toObject();
        delete productSnapshot.__v;
        delete productSnapshot.createdAt;
        delete productSnapshot.updatedAt;

        const orderItem = new OrderItemDetail({
          product_id: product._id,
          product_detail: productSnapshot,
          name: product.name,
          thumbnail: product.thumbnail,
          selected_variant: item.selected_variant,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: itemTotal,
          tax: item.tax,
          discount: item.discount,
          discount_type: item.discount_type,
          tax_model: item.tax_model,
          slug: item.slug,
          seller_id: sellerKey === "admin" ? null : item.seller_id,
          seller_is: sellerKey === "admin" ? "admin" : "seller",
          shipping_cost: item.shipping_cost,
          shipping_type: item.shipping_type,
          shipping_address: shippingAddressId,
          delivery_status: "Pending",
        });

        await orderItem.save();
        orderItemIds.push(orderItem._id);

        // ✅ Stock update
        if (item.is_variant && item.variant_id) {
          await VariantOption.updateOne({ _id: item.variant_id }, { $inc: { stock: -item.quantity } });
        } else {
          product.current_stock -= item.quantity;
          await product.save();
        }
      }

      // ✅ Coupon handling
      const couponItem = items.find(i => i.coupon_code && i.coupon_amount);
      let couponCode = null;
      let couponAmount = 0;
      if (couponItem) {
        couponCode = couponItem.coupon_code;
        couponAmount = couponItem.coupon_amount || 0;
        totalOrderPrice -= couponAmount;
      }

      totalOrderPrice += deliveryCharge;

      const latestOrder = await Order.findOne().sort({ order_id: -1 }).select("order_id").lean();
      const newOrderId = latestOrder?.order_id ? latestOrder.order_id + 1 : 100001;

      const order = new Order({
        customer_id: userId,
        order_id: newOrderId,
        order_items: orderItemIds,
        shipping_address: shippingAddressId,
        total_price: totalOrderPrice,
        delivery_charge: deliveryCharge,
        status: "Confirmed",
        payment_status: "Paid",
        payment_method: req.body.payment_method || "online",
        coupon_code: couponCode,
        coupon_amount: couponAmount,
        seller_id: sellerKey === "admin" ? null : items[0].seller_id,
        seller_is: sellerKey === "admin" ? "admin" : "seller",
      });

      await order.save();
      orderResults.push(order._id);

      await OrderItemDetail.updateMany({ _id: { $in: orderItemIds } }, { order_id: order._id });

      // ✅ Commission & Wallet
      const amountBeforeDelivery = totalOrderPrice - deliveryCharge;

      if (sellerKey === "admin") {
        admin.admin_wallet += amountBeforeDelivery;
      } else {
        const commission = (amountBeforeDelivery * commissionPercent) / 100;
        const sellerAmount = amountBeforeDelivery - commission;

        admin.seller_commission += commission;

        await Seller.findByIdAndUpdate(items[0].seller_id._id, {
          $inc: { seller_wallet: sellerAmount }
        });
      }

      // ✅ Transaction
      await new Transaction({
        order_id: order._id,
        user_id: userId,
        paid_by: userId,
        paid_to: sellerKey === "admin" ? null : items[0].seller_id._id,
        amount: totalOrderPrice,
        payment_status: "Paid",
      }).save();
    }

    await admin.save();
    await Cart.deleteMany({ customer_id: userId, save_for_later: false });

    return res.status(201).json({
      message: "Online order placed successfully",
      order_ids: orderResults,
    });

  } catch (error) {
    console.error("Error placing Online order:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function placeOrderFromWallet(req, res) {
  try {
    const userId = req.user.id;
    const shippingAddressId = req.body.address_id;

    const cartItems = await Cart.find({
      customer_id: userId,
      save_for_later: false,
    }).populate("product_id").populate("seller_id");

    if (!cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const deliveryRes = await axios.get(`${process.env.BASE_URL}/users/business-setup/deliveryCharges`);
    const deliveryCharge = deliveryRes.data?.deliveryCharges || 0;

    const commissionRes = await axios.get(`${process.env.BASE_URL}/users/business-setup/seller-commission`);
    const commissionPercent = commissionRes.data?.sellerCommission || 0;

    const admin = await Admin.findOne();
    if (!admin) return res.status(500).json({ message: "Admin config missing" });

    // ✅ Validate stock
    for (const item of cartItems) {
      const product = item.product_id;
      if (!product) return res.status(400).json({ message: `Product not found for cart item ${item._id}` });

      if (item.is_variant && item.variant_id) {
        const variant = await VariantOption.findOne({ _id: item.variant_id, product_id: product._id });
        if (!variant || variant.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for variant of ${product.name}` });
        }
      } else if (product.current_stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
      }
    }

    // ✅ Group by seller
    const groupedItems = {};
    for (const item of cartItems) {
      const key = item.seller_is === "admin" ? "admin" : item.seller_id._id.toString();
      if (!groupedItems[key]) groupedItems[key] = [];
      groupedItems[key].push(item);
    }

    const orderResults = [];
    let totalWalletAmountRequired = 0;

    // ✅ Pre-calculate total wallet required
    for (const items of Object.values(groupedItems)) {
      let subtotal = items.reduce((sum, i) => sum + i.total_price + (i.shipping_cost || 0), 0);
      const couponItem = items.find(i => i.coupon_amount);
      if (couponItem) subtotal -= couponItem.coupon_amount || 0;
      subtotal += deliveryCharge;
      totalWalletAmountRequired += subtotal;
    }

    if (user.wallet_amount < totalWalletAmountRequired) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    for (const [key, items] of Object.entries(groupedItems)) {
      let totalOrderPrice = 0;
      const orderItemIds = [];

      for (const item of items) {
        const product = item.product_id;
        const itemTotal = item.total_price + (item.shipping_cost || 0);
        totalOrderPrice += itemTotal;

        const orderItem = new OrderItemDetail({
          product_id: product._id,
          product_detail: product.toObject(),
          name: product.name,
          thumbnail: product.thumbnail,
          selected_variant: item.selected_variant,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: itemTotal,
          tax: item.tax,
          discount: item.discount,
          discount_type: item.discount_type,
          tax_model: item.tax_model,
          slug: item.slug,
          seller_id: item.seller_is === "admin" ? null : item.seller_id,
          seller_is: item.seller_is,
          shipping_cost: item.shipping_cost,
          shipping_type: item.shipping_type,
          shipping_address: shippingAddressId,
          delivery_status: "Pending",
        });

        await orderItem.save();
        orderItemIds.push(orderItem._id);

        if (item.is_variant && item.variant_id) {
          await VariantOption.updateOne(
            { _id: item.variant_id },
            { $inc: { stock: -item.quantity } }
          );
        } else {
          product.current_stock -= item.quantity;
          await product.save();
        }
      }

      // ✅ Apply coupon
      const couponItem = items.find(i => i.coupon_amount);
      let couponCode = null;
      let couponAmount = 0;
      if (couponItem) {
        couponCode = couponItem.coupon_code;
        couponAmount = couponItem.coupon_amount || 0;
        totalOrderPrice -= couponAmount;
      }

      totalOrderPrice += deliveryCharge;

      const latestOrder = await Order.findOne().sort({ order_id: -1 }).select("order_id").lean();
      const newOrderId = latestOrder?.order_id ? latestOrder.order_id + 1 : 100001;

      const order = new Order({
        customer_id: userId,
        order_id: newOrderId,
        order_items: orderItemIds,
        shipping_address: shippingAddressId,
        total_price: totalOrderPrice,
        delivery_charge: deliveryCharge,
        status: "Confirmed",
        payment_status: "Paid",
        payment_method: "wallet",
        coupon_code: couponCode,
        coupon_amount: couponAmount,
        seller_id: key === "admin" ? null : items[0].seller_id._id,
        seller_is: items[0].seller_is,
      });

      await order.save();
      orderResults.push(order._id);

      await OrderItemDetail.updateMany({ _id: { $in: orderItemIds } }, { order_id: order._id });

      // ✅ Calculate commission and update wallets
      const amountWithoutDelivery = totalOrderPrice - deliveryCharge;

      if (items[0].seller_is === "admin") {
        admin.admin_wallet += amountWithoutDelivery;
      } else {
        const commission = (amountWithoutDelivery * commissionPercent) / 100;
        const sellerEarning = amountWithoutDelivery - commission;

        admin.seller_commission += commission;
        await Seller.findByIdAndUpdate(items[0].seller_id._id, {
          $inc: { seller_wallet: sellerEarning }
        });
      }

      await new Transaction({
        order_id: order._id,
        user_id: userId,
        paid_by: userId,
        paid_to: items[0].seller_is === "admin" ? null : items[0].seller_id._id,
        amount: totalOrderPrice,
        payment_status: "Paid",
      }).save();
    }

    // ✅ Final wallet deductions
    user.wallet_amount -= totalWalletAmountRequired;
    await user.save();
    await admin.save();

    await new WalletTransaction({
      user: userId,
      type: "debit",
      amount: totalWalletAmountRequired,
      balanceAfter: user.wallet_amount,
      description: "Order Payment from Wallet",
    }).save();

    await Cart.deleteMany({ customer_id: userId, save_for_later: false });

    return res.status(201).json({
      message: "Order placed successfully using wallet",
      order_ids: orderResults,
    });

  } catch (error) {
    console.error("Error placing wallet order:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}




module.exports = {
  placeOrder,
  getUserOrders,
  getUserOrderById,
  placeOrderOnline,
  placeOrderFromWallet,
};