const mongoose = require("mongoose");

const bankInfoSchema = new mongoose.Schema({
    seller_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
        required: false,
        index: true,
    },
    account_holder_name: {
        type: String,
        required: true,
        trim: true,
    },
    bank_name: {
        type: String,
        required: true,
        trim: true,
    },
    account_number: {
        type: String,
        required: true,
        unique: true,
    },
    ifsc_code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
    },
    branch_name: {
        type: String,
        required: false,
        trim: true,
    },
    upi_id: {
        type: String,
        required: false,
        trim: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("BankInfo", bankInfoSchema);
