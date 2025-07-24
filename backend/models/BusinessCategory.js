const mongoose = require('mongoose');

const BusinessCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('BusinessCategory', BusinessCategorySchema);
