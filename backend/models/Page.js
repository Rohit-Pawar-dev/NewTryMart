const mongoose = require('mongoose');
const { Schema } = mongoose;

const pageSchema = new Schema({
  title: {
    type: String,
    required: true,
    minlength: 3
  },
  content: {
    type: String,
    required: [true],
  },
  slug: {
    type: String,
    required: [true],
    unique: true
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Page', pageSchema);
