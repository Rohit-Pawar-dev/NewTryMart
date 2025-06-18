const mongoose = require('mongoose');
const { Schema } = mongoose;

const bannerSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    // required: true
  },
  video: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  banner_type: {
    type: String,
    enum: ['main', 'popup', 'advertisementImage', 'advertisementVideo'],
    default: 'main'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Banner', bannerSchema);
