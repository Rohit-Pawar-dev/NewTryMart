const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema(
    {
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        seller_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Seller',
            required: false,
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Denied', 'Returned'],
            default: 'Pending',
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        proof_images: [
            {
                type: String,
            },
        ],
        admin_response: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('ReturnRequests', returnRequestSchema);

