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
  timestamps: true // adds createdAt and updatedAt
});

module.exports = mongoose.model('BusinessSetup', BusinessSetupSchema);
