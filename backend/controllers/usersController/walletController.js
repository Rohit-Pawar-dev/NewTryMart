const User = require("../../models/User"); 
const WalletTransaction = require("../../models/WalletTransaction");

// Add money (Credit)
exports.addMoneyToWallet = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.wallet_amount += amount;
        await user.save();

        const transaction = new WalletTransaction({
            user: user._id,
            type: "credit",
            amount,
            balanceAfter: user.wallet_amount,
            description: description || "Wallet Top-up",
        });
        await transaction.save();

        res.json({ message: "Money added successfully", wallet: user.wallet_amount, transaction });
    } catch (error) {
        console.error("Add money error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Deduct money (Debit)
exports.debitMoneyFromWallet = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.wallet_amount < amount) {
            return res.status(400).json({ message: "Insufficient wallet balance" });
        }

        user.wallet_amount -= amount;
        await user.save();

        const transaction = new WalletTransaction({
            user: user._id,
            type: "debit",
            amount,
            balanceAfter: user.wallet_amount,
            description: description || "Wallet Debit",
        });
        await transaction.save();

        res.json({ message: "Money debited successfully", wallet: user.wallet_amount, transaction });
    } catch (error) {
        console.error("Debit money error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get current wallet balance
exports.getWalletBalance = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select("wallet_amount");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ wallet_balance: user.wallet_amount });
    } catch (error) {
        console.error("Get wallet balance error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get wallet transactions
exports.getWalletTransactions = async (req, res) => {
    try {
        const { userId } = req.params;

        const transactions = await WalletTransaction.find({ user: userId })
            .sort({ createdAt: -1 });

        res.json({ transactions });
    } catch (error) {
        console.error("Get transactions error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
