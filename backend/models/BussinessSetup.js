const mongoose = require('mongoose');

const BusinessSetupSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    match: [/^\+?[0-9\- ]{10,20}$/, 'Please enter a valid phone number']
  },
  companyEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address']
  },
  websiteLogo: {
    type: String,
    trim: true
  },
  sellerCommision: {
    type: Number,
    trim: true,
    default: 0,

  },
  display_cod_payment: {
    type: Boolean,
    default: true
  },
  display_online_payment: {
    type: Boolean,
    default: true
  },
  display_wallet_payment: {
    type: Boolean,
    default: true
  },
  deliveryCharges: {
    type: Number,
    default: 0
  },
  razorPayKey: {
    type: String,
    required: true
  },
  companyAddress: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  timezone: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BusinessSetup', BusinessSetupSchema);
