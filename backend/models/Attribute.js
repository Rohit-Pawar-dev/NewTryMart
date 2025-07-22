const mongoose = require("mongoose");
const { Schema } = mongoose;

const attributeSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ["size", "color"], 
    },
    value: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
}, { timestamps: true });

module.exports = mongoose.model("Attribute", attributeSchema);
