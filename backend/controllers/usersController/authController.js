// controllers/businessSetupController.js
const BusinessSetup = require("../../models/BussinessSetup");

exports.getPaymentOptions = async (req, res) => {
    try {
        const business = await BusinessSetup.findOne();

        if (!business) {
            return res.status(404).json({
                status: false,
                message: "Business setup not found",
            });
        }
        const paymentOptions = [
            {
                name: "Cash on Delivery",
                key: "display_cod_payment",
                enabled: business.display_cod_payment,
            },
            {
                name: "Online Payment",
                key: "display_online_payment",
                enabled: business.display_online_payment,
            },
            {
                name: "Wallet Payment",
                key: "display_wallet_payment",
                enabled: business.display_wallet_payment,
            },
        ];
        const businessDetail = {
            name: business.companyName,
            phone: business.phone,
            email: business.companyEmail,
            razor_pay_key: business.razorPayKey,
        };

        return res.status(200).json({
            status: true,
            message: "Payment options fetched successfully",
            paymentOptions: paymentOptions,
            businessDetail: businessDetail
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
        });
    }
};
