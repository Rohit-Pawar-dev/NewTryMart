// models/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponTitle: {
    type: String,
    required: true,
    trim: true
  },
  couponCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed']
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0
  },
  minimumPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  expireDate: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('Coupon', couponSchema);
