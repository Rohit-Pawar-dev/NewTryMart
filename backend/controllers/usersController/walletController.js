const User = require("../../models/User");
const WalletTransaction = require("../../models/WalletTransaction");

// Add money (Credit)
exports.addMoneyToWallet = async (req, res) => {
    try {
        const userId = req.user?.id;
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
        const userId = req.user?.id;
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
        const userId = req.user?.id;

        const user = await User.findById(userId).select("wallet_amount");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ wallet_balance: user.wallet_amount });
    } catch (error) {
        console.error("Get wallet balance error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getWalletTransactions = async (req, res) => {
    try {
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const filter = { user: userId };

        const total = await WalletTransaction.countDocuments(filter);
        const transactions = await WalletTransaction.find(filter)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);

        res.json({
            status: true,
            message: "Transactions fetched successfully",
            transactions,
            total,
            limit,
            offset,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Get transactions error:", error);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};
