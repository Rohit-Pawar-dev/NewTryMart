const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  image: {
    type: String, 
    default: null
  }
}, {
  timestamps: true 
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
