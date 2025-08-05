const mongoose = require('mongoose');
const { Schema } = mongoose;

const wishlistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    variantValues: {
        type: Map,
        of: String,
        default: null,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

wishlistSchema.index({ userId: 1, productId: 1, variantValues: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
