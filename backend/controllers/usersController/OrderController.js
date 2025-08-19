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
const BussinessSetup = require("../../models/BussinessSetup")
require('dotenv').config();

async function placeOrder(req, res) {
  try {
    const userId = req.body.user_id;
    const shippingAddressId = req.body.address_id;

    const cartItems = await Cart.find({ customer_id: userId, save_for_later: false })
      .populate("product_id")
      .populate("seller_id");

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ status: false, message: "Cart is empty" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    const businessSetup = await BussinessSetup.findOne();
    const deliveryCharge = businessSetup?.deliveryCharges || 0;

    const admin = await Admin.findOne();
    if (!admin) return res.status(500).json({ status: false, message: "Admin config missing" });

    //  Validate stock
    for (const item of cartItems) {
      const product = item.product_id;
      if (!product) {
        return res.status(400).json({ status: false, message: `Product not found for cart item ${item._id}` });
      }

      if (item.is_variant && item.variant_id) {
        const variant = await VariantOption.findOne({ _id: item.variant_id, product_id: product._id });
        if (!variant || variant.stock < item.quantity) {
          return res.status(400).json({ status: false, message: `Insufficient stock for variant of ${product.name}` });
        }
      } else if (product.current_stock < item.quantity) {
        return res.status(400).json({ status: false, message: `Insufficient stock for product ${product.name}` });
      }
    }

    // Group cart items by seller/admin
    const groupedItems = {};
    for (const item of cartItems) {
      const sellerKey = item.added_by === "admin" || !item.seller_id
        ? "admin"
        : item.seller_id._id.toString();

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

        //  Deduct stock
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

      // Apply coupon
      const couponItem = items.find(item => item.coupon_code && item.coupon_amount);
      let couponCode = null;
      let couponAmount = 0;
      if (couponItem) {
        couponCode = couponItem.coupon_code;
        couponAmount = couponItem.coupon_amount || 0;
        totalOrderPrice -= couponAmount;
      }

      //  Add delivery charge
      totalOrderPrice += deliveryCharge;

      //  Generate order_id
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

      //  Transaction created as Pending only (settlement will happen on delivery)
      await new Transaction({
        order_id: order._id,
        user_id: userId,
        paid_by: userId,
        paid_to: sellerKey === "admin" ? null : items[0].seller_id?._id || null,
        amount: totalOrderPrice,
        payment_status: "Pending",
      }).save();
    }

    await Cart.deleteMany({ customer_id: userId, save_for_later: false });

    return res.status(201).json({
      status: true,
      message: "Orders placed successfully",
      order_ids: orderResults,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ status: false, message: "Server error", error: error.message });
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

// const getUserOrderById = async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.id,
//       customer_id: req.user.id,
//     })
//       .populate("customer_id", "name email mobile")
//       .populate("shipping_address")
//       .populate({
//         path: "order_items",
//         populate: [
//           {
//             path: "product_id",
//             select: "name thumbnail",
//           },
//           {
//             path: "seller_id",
//             select: "shop_name",
//           },
//         ],
//       });

//     if (!order) {
//       return res.status(404).json({
//         status: false,
//         message: "Order not found or unauthorized",
//       });
//     }

//     return res.status(200).json({
//       status: true,
//       message: "Order fetched successfully",
//       data: order,
//     });
//   } catch (err) {
//     console.error("Error fetching order by ID:", err);
//     return res.status(500).json({ status: false, message: "Server error" });
//   }
// };

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

    // Calculation breakdown
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of order.order_items) {
      const itemBasePrice = item.unit_price * item.quantity;
      subtotal += itemBasePrice;

      // Discount calculation
      let discountValue = 0;
      if (item.discount && item.discount_type) {
        if (item.discount_type === "percent") {
          discountValue = (item.unit_price * item.discount) / 100 * item.quantity;
        } else {
          discountValue = item.discount * item.quantity;
        }
      }
      totalDiscount += discountValue;

      // Tax (assuming tax is a percentage)
      let taxValue = 0;
      if (item.tax) {
        taxValue = ((item.unit_price - (discountValue / item.quantity)) * item.tax / 100) * item.quantity;
        totalTax += taxValue;
      }
    }

    const couponAmount = order.coupon_amount || 0;
    const deliveryCharge = order.delivery_charge || 0;

    const finalPayable =
      subtotal - totalDiscount + totalTax - couponAmount + deliveryCharge;

    const breakdown = {
      subtotal,
      totalDiscount,
      totalTax,
      couponAmount,
      deliveryCharge,
      finalPayable,
    };

    return res.status(200).json({
      status: true,
      message: "Order fetched successfully",
      data: {
        ...order.toObject(),
        breakdown,
      },
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
    const razorpayPaymentId = req.body.razorpay_payment_id;

    const cartItems = await Cart.find({ customer_id: userId, save_for_later: false })
      .populate("product_id")
      .populate("seller_id");

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ status: false, message: "Cart is empty" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    const businessSetup = await BussinessSetup.findOne();
    const deliveryCharge = businessSetup?.deliveryCharges || 0;
    const commissionPercent = businessSetup?.sellerCommision || 0;
    const admin = await Admin.findOne();
    if (!admin) return res.status(500).json({ status: false, message: "Admin config missing" });

    //  Stock check
    for (const item of cartItems) {
      const product = item.product_id;
      if (!product) return res.status(400).json({ status: false, message: `Product not found for cart item ${item._id}` });

      if (item.is_variant && item.variant_id) {
        const variant = await VariantOption.findOne({ _id: item.variant_id, product_id: product._id });
        if (!variant || variant.stock < item.quantity) {
          return res.status(400).json({ status: false, message: `Insufficient stock for variant of ${product.name}` });
        }
      } else if (product.current_stock < item.quantity) {
        return res.status(400).json({ status: false, message: `Insufficient stock for product ${product.name}` });
      }
    }

    //  Group by seller
    const groupedItems = {};
    for (const item of cartItems) {
      const sellerKey = item.added_by === "admin" ? "admin" : item.seller_id?._id.toString();
      if (!groupedItems[sellerKey]) groupedItems[sellerKey] = [];
      groupedItems[sellerKey].push(item);
    }

    const orderResults = [];

    //  Process each group
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

        //  Stock update
        if (item.is_variant && item.variant_id) {
          await VariantOption.updateOne({ _id: item.variant_id }, { $inc: { stock: -item.quantity } });
        } else {
          product.current_stock -= item.quantity;
          await product.save();
        }
      }

      //  Coupon handling
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
        transaction_id: razorpayPaymentId,
      });

      await order.save();
      orderResults.push(order._id);

      await OrderItemDetail.updateMany({ _id: { $in: orderItemIds } }, { order_id: order._id });

      //  Commission & Wallet
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

      //  Transaction
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
      status: true,
      message: "Online order placed successfully",
      order_ids: orderResults,
    });

  } catch (error) {
    console.error("Error placing Online order:", error);
    return res.status(500).json({ status: false, message: "Server error", error: error.message });
  }
}




// async function placeOrderFromWallet(req, res) {
//   try {
//     const userId = req.user.id;
//     const shippingAddressId = req.body.address_id;

//     // Get cart items
//     const cartItems = await Cart.find({
//       customer_id: userId,
//       save_for_later: false,
//     })
//       .populate("product_id")
//       .populate("seller_id");

//     if (!cartItems.length) {
//       return res.status(400).json({ status: false, message: "Cart is empty" });
//     }

//     // Get user
//     const user = await User.findById(userId);
//     if (!user)
//       return res
//         .status(404)
//         .json({ status: false, message: "User not found" });

//     // Business setup (delivery + commission)
//     const businessSetup = await BussinessSetup.findOne();
//     const deliveryCharge = businessSetup?.deliveryCharges || 0;
//     const commissionPercent = businessSetup?.sellerCommision || 0;

//     // Admin config
//     const admin = await Admin.findOne();
//     if (!admin)
//       return res
//         .status(500)
//         .json({ status: false, message: "Admin config missing" });

//     // Stock validation
//     for (const item of cartItems) {
//       const prod = item.product_id;
//       if (!prod) {
//         return res.status(400).json({
//           status: false,
//           message: `Product missing for cart item ${item._id}`,
//         });
//       }

//       if (item.is_variant && item.variant_id) {
//         const variant = await VariantOption.findOne({
//           _id: item.variant_id,
//           product_id: prod._id,
//         });
//         if (!variant || variant.stock < item.quantity) {
//           return res.status(400).json({
//             status: false,
//             message: `Insufficient stock for variant ${prod.name}`,
//           });
//         }
//       } else if (prod.current_stock < item.quantity) {
//         return res.status(400).json({
//           status: false,
//           message: `Insufficient stock for product ${prod.name}`,
//         });
//       }
//     }

//     // Group items by seller
//     const grouped = {};
//     for (const item of cartItems) {
//       const key =
//         item.seller_is === "admin" ? "admin" : item.seller_id._id.toString();
//       (grouped[key] ||= []).push(item);
//     }

//     // Pre-calc wallet required
//     let totalWalletRequired = 0;
//     for (const items of Object.values(grouped)) {
//       let subtotal = 0;
//       for (const i of items) {
//         const unit = i.unit_price;
//         let discountAmt = 0;
//         if (i.discount_type === "flat") discountAmt = i.discount || 0;
//         else discountAmt = (unit * (i.discount || 0)) / 100;

//         const priceAfterDiscount = unit - discountAmt;
//         const taxAmt =
//           i.tax_model === "exclusive"
//             ? (priceAfterDiscount * (i.tax || 0)) / 100
//             : 0;

//         const finalUnit = priceAfterDiscount + taxAmt;
//         subtotal += finalUnit * i.quantity;
//       }
//       subtotal += deliveryCharge;

//       const couponItem = items.find((x) => x.coupon_amount);
//       if (couponItem) subtotal -= couponItem.coupon_amount || 0;

//       totalWalletRequired += subtotal;
//     }

//     // Wallet balance check
//     if (user.wallet_amount < totalWalletRequired) {
//       return res
//         .status(400)
//         .json({ status: false, message: "Insufficient wallet balance" });
//     }

//     const orderIds = [];

//     // Create order per seller group
//     for (const [key, items] of Object.entries(grouped)) {
//       let orderPrice = 0;
//       let totalDiscount = 0;
//       let totalTax = 0;
//       const orderItemIds = [];

//       for (const item of items) {
//         const unit = item.unit_price;
//         let discountAmt = 0;
//         if (item.discount_type === "flat") discountAmt = item.discount || 0;
//         else discountAmt = (unit * (item.discount || 0)) / 100;

//         const priceAfterDiscount = unit - discountAmt;
//         const taxAmt =
//           item.tax_model === "exclusive"
//             ? (priceAfterDiscount * (item.tax || 0)) / 100
//             : 0;

//         const finalUnit = priceAfterDiscount + taxAmt;
//         const itemTotal = finalUnit * item.quantity;

//         totalDiscount += discountAmt * item.quantity;
//         totalTax += taxAmt * item.quantity;
//         orderPrice += itemTotal;

//         const orderItem = new OrderItemDetail({
//           product_id: item.product_id._id,
//           product_detail: item.product_id.toObject(),
//           name: item.product_id.name,
//           thumbnail: item.product_id.thumbnail,
//           selected_variant: item.selected_variant,
//           quantity: item.quantity,
//           unit_price: unit,
//           total_price: itemTotal,
//           tax: taxAmt,
//           discount: discountAmt,
//           discount_type: item.discount_type,
//           tax_model: item.tax_model,
//           slug: item.slug,
//           seller_id:
//             item.seller_is === "admin" ? admin._id : item.seller_id._id,
//           seller_is: item.seller_is,
//           shipping_cost: item.shipping_cost,
//           shipping_type: item.shipping_type,
//           shipping_address: shippingAddressId,
//           delivery_status: "Pending",
//         });

//         await orderItem.save();
//         orderItemIds.push(orderItem._id);

//         // decrement stock
//         if (item.is_variant && item.variant_id) {
//           await VariantOption.updateOne(
//             { _id: item.variant_id },
//             { $inc: { stock: -item.quantity } }
//           );
//         } else {
//           item.product_id.current_stock -= item.quantity;
//           await item.product_id.save();
//         }
//       }

//       // Coupon
//       let couponAmt = 0,
//         couponCode = null;
//       const cp = items.find((i) => i.coupon_amount);
//       if (cp) {
//         couponAmt = cp.coupon_amount || 0;
//         couponCode = cp.coupon_code;
//         orderPrice -= couponAmt;
//       }

//       orderPrice += deliveryCharge;

//       // New order_id
//       const latest = await Order.findOne()
//         .sort({ order_id: -1 })
//         .select("order_id")
//         .lean();
//       const newOrderId = latest?.order_id ? latest.order_id + 1 : 100001;

//       // Admin commission calc
//       const amtNet = orderPrice - deliveryCharge;
//       let adminCommission = 0;
//       if (items[0].seller_is !== "admin") {
//         adminCommission = (amtNet * commissionPercent) / 100;
//       }

//       const newOrder = new Order({
//         customer_id: userId,
//         order_id: newOrderId,
//         order_items: orderItemIds,
//         shipping_address: shippingAddressId,
//         total_price: orderPrice,
//         delivery_charge: deliveryCharge,
//         status: "Confirmed",
//         payment_status: "Paid",
//         payment_method: "wallet",
//         coupon_code: couponCode,
//         coupon_amount: couponAmt,
//         seller_id:
//           items[0].seller_is === "admin" ? admin._id : items[0].seller_id._id,
//         seller_is: items[0].seller_is,
//         admin_commission: adminCommission,
//       });

//       await newOrder.save();
//       orderIds.push(newOrder._id);

//       await OrderItemDetail.updateMany(
//         { _id: { $in: orderItemIds } },
//         { order_id: newOrder._id }
//       );

//       // update wallets & commission
//       if (items[0].seller_is === "admin") {
//         admin.admin_wallet += amtNet;
//       } else {
//         const sellerEarning = amtNet - adminCommission;
//         admin.seller_commission += adminCommission;
//         await Seller.findByIdAndUpdate(items[0].seller_id._id, {
//           $inc: { seller_wallet: sellerEarning },
//         });
//       }

//       // record transaction
//       await new Transaction({
//         order_id: newOrder._id,
//         user_id: userId,
//         paid_by: userId,
//         paid_to:
//           items[0].seller_is === "admin" ? admin._id : items[0].seller_id._id,
//         amount: orderPrice,
//         payment_status: "Paid",
//       }).save();
//     }

//     // Deduct from user wallet
//     user.wallet_amount -= totalWalletRequired;
//     await user.save();
//     await admin.save();

//     // Wallet transaction record
//     await new WalletTransaction({
//       user: userId,
//       type: "debit",
//       amount: totalWalletRequired,
//       balanceAfter: user.wallet_amount,
//       description: "Order Payment from Wallet",
//     }).save();

//     // Clear cart
//     await Cart.deleteMany({ customer_id: userId, save_for_later: false });

//     return res.status(201).json({
//       status: true,
//       message: "Order(s) placed successfully using wallet",
//       order_ids: orderIds,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       status: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// }

// Place order using wallet amount
async function placeOrderFromWallet(req, res) {
  try {
    const userId = req.user.id;
    const shippingAddressId = req.body.address_id;

    // Get cart items
    const cartItems = await Cart.find({
      customer_id: userId,
      save_for_later: false,
    })
      .populate("product_id")
      .populate("seller_id");

    if (!cartItems.length) {
      return res.status(400).json({ status: false, message: "Cart is empty" });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ status: false, message: "User not found" });

    // Business setup
    const businessSetup = await BussinessSetup.findOne();
    const deliveryCharge = businessSetup?.deliveryCharges || 0;
    const commissionPercent = businessSetup?.sellerCommision || 0;

    // Admin config
    const admin = await Admin.findOne();
    if (!admin)
      return res
        .status(500)
        .json({ status: false, message: "Admin config missing" });

    for (const item of cartItems) {
      const prod = item.product_id;
      if (!prod) {
        return res.status(400).json({
          status: false,
          message: `Product missing for cart item ${item._id}`,
        });
      }

      if (item.is_variant && item.variant_id) {
        const variant = await VariantOption.findOne({
          _id: item.variant_id,
          product_id: prod._id,
        });
        if (!variant || variant.stock < item.quantity) {
          return res.status(400).json({
            status: false,
            message: `Insufficient stock for variant ${prod.name}`,
          });
        }
      } else if (prod.current_stock < item.quantity) {
        return res.status(400).json({
          status: false,
          message: `Insufficient stock for product ${prod.name}`,
        });
      }
    }
    const grouped = {};
    for (const item of cartItems) {
      const key =
        item.seller_is === "admin" ? "admin" : item.seller_id._id.toString();
      (grouped[key] ||= []).push(item);
    }
    let totalWalletRequired = 0;
    for (const items of Object.values(grouped)) {
      let subtotal = 0;
      for (const i of items) {
        const unit = i.unit_price;
        let discountAmt = 0;
        if (i.discount_type === "flat") discountAmt = i.discount || 0;
        else discountAmt = (unit * (i.discount || 0)) / 100;

        const priceAfterDiscount = unit - discountAmt;
        const taxAmt =
          i.tax_model === "exclusive"
            ? (priceAfterDiscount * (i.tax || 0)) / 100
            : 0;

        const finalUnit = priceAfterDiscount + taxAmt;
        subtotal += finalUnit * i.quantity;
      }
      subtotal += deliveryCharge;

      const couponItem = items.find((x) => x.coupon_amount);
      if (couponItem) subtotal -= couponItem.coupon_amount || 0;

      totalWalletRequired += subtotal;
    }
    if (user.wallet_amount < totalWalletRequired) {
      return res
        .status(400)
        .json({ status: false, message: "Insufficient wallet balance" });
    }

    const orderIds = [];

    for (const [key, items] of Object.entries(grouped)) {
      let orderPrice = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      const orderItemIds = [];

      for (const item of items) {
        const unit = item.unit_price;
        let discountAmt = 0;
        if (item.discount_type === "flat") discountAmt = item.discount || 0;
        else discountAmt = (unit * (item.discount || 0)) / 100;

        const priceAfterDiscount = unit - discountAmt;
        const taxAmt =
          item.tax_model === "exclusive"
            ? (priceAfterDiscount * (item.tax || 0)) / 100
            : 0;

        const finalUnit = priceAfterDiscount + taxAmt;
        const itemTotal = finalUnit * item.quantity;

        totalDiscount += discountAmt * item.quantity;
        totalTax += taxAmt * item.quantity;
        orderPrice += itemTotal;

        const orderItem = new OrderItemDetail({
          product_id: item.product_id._id,
          product_detail: item.product_id.toObject(),
          name: item.product_id.name,
          thumbnail: item.product_id.thumbnail,
          selected_variant: item.selected_variant,
          quantity: item.quantity,
          unit_price: unit,
          total_price: itemTotal,
          tax: taxAmt,
          discount: discountAmt,
          discount_type: item.discount_type,
          tax_model: item.tax_model,
          slug: item.slug,
          seller_id:
            item.seller_is === "admin" ? admin._id : item.seller_id._id,
          seller_is: item.seller_is,
          shipping_cost: item.shipping_cost,
          shipping_type: item.shipping_type,
          shipping_address: shippingAddressId,
          delivery_status: "Pending",
        });

        await orderItem.save();
        orderItemIds.push(orderItem._id);

        // decrement stock
        if (item.is_variant && item.variant_id) {
          await VariantOption.updateOne(
            { _id: item.variant_id },
            { $inc: { stock: -item.quantity } }
          );
        } else {
          item.product_id.current_stock -= item.quantity;
          await item.product_id.save();
        }
      }

      let couponAmt = 0,
        couponCode = null;
      const cp = items.find((i) => i.coupon_amount);
      if (cp) {
        couponAmt = cp.coupon_amount || 0;
        couponCode = cp.coupon_code;
        orderPrice -= couponAmt;
      }

      orderPrice += deliveryCharge;

      const latest = await Order.findOne()
        .sort({ order_id: -1 })
        .select("order_id")
        .lean();
      const newOrderId = latest?.order_id ? latest.order_id + 1 : 100001;

      const amtNet = orderPrice - deliveryCharge;
      let adminCommission = 0;
      if (items[0].seller_is !== "admin") {
        adminCommission = (amtNet * commissionPercent) / 100;
      }

      const newOrder = new Order({
        customer_id: userId,
        order_id: newOrderId,
        order_items: orderItemIds,
        shipping_address: shippingAddressId,
        total_price: orderPrice,
        delivery_charge: deliveryCharge,
        status: "Confirmed",
        payment_status: "Paid",
        payment_method: "wallet",
        coupon_code: couponCode,
        coupon_amount: couponAmt,
        seller_id:
          items[0].seller_is === "admin" ? admin._id : items[0].seller_id._id,
        seller_is: items[0].seller_is,
        admin_commission: adminCommission,
      });

      await newOrder.save();
      orderIds.push(newOrder._id);

      await OrderItemDetail.updateMany(
        { _id: { $in: orderItemIds } },
        { order_id: newOrder._id }
      );
      if (items[0].seller_is === "admin") {
        admin.admin_wallet += amtNet + deliveryCharge;

        await new WalletTransaction({
          admin: admin._id,
          type: "credit",
          amount: amtNet + deliveryCharge,
          balanceAfter: admin.admin_wallet,
          description: `Order #${newOrder.order_id} payment received with delivery charge`,
        }).save();
      } else {
        const sellerEarning = amtNet - adminCommission;
        admin.seller_commission += adminCommission;
        admin.admin_wallet += adminCommission + deliveryCharge;

        await Seller.findByIdAndUpdate(items[0].seller_id._id, {
          $inc: { seller_wallet: sellerEarning },
        });

        const seller = await Seller.findById(items[0].seller_id._id);

        // Seller transaction
        await new WalletTransaction({
          seller: seller._id,
          type: "credit",
          amount: sellerEarning,
          balanceAfter: seller.seller_wallet,
          description: `Earning from Order #${newOrder.order_id}`,
        }).save();

        // Admin commission transaction
        await new WalletTransaction({
          admin: admin._id,
          type: "credit",
          amount: adminCommission + deliveryCharge,
          balanceAfter: admin.admin_wallet,
          description: `Commission from Order #${newOrder.order_id} with delivery charge`,
        }).save();
      }
      await new Transaction({
        order_id: newOrder._id,
        user_id: userId,
        paid_by: userId,
        paid_to:
          items[0].seller_is === "admin" ? admin._id : items[0].seller_id._id,
        amount: orderPrice,
        payment_status: "Paid",
      }).save();
    }
    user.wallet_amount -= totalWalletRequired;
    await user.save();
    await admin.save();

    await new WalletTransaction({
      user: userId,
      type: "debit",
      amount: totalWalletRequired,
      balanceAfter: user.wallet_amount,
      description: "Order Payment from Wallet",
    }).save();

    await Cart.deleteMany({ customer_id: userId, save_for_later: false });

    return res.status(201).json({
      status: true,
      message: "Order(s) placed successfully using wallet",
      order_ids: orderIds,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: err.message,
    });
  }
}

module.exports = {
  placeOrder,
  getUserOrders,
  getUserOrderById,
  placeOrderOnline,
  placeOrderFromWallet,
};