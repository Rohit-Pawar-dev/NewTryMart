const mongoose = require("mongoose");

const WalletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "Seller" },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  type: { type: String, enum: ["credit", "debit"], required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WalletTransaction", WalletTransactionSchema);
