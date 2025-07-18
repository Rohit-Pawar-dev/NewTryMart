const mongoose = require("mongoose");
const { Schema } = mongoose;

const attributeSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ["size", "color"], // or any other valid attribute types
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
});

module.exports = mongoose.model("Attribute", attributeSchema);
