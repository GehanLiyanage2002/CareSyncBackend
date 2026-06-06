const crypto = require('crypto');

exports.generateHash = (req, res) => {
    try {
        const { order_id, amount, currency } = req.body;
        const merchant_id = process.env.PAYHERE_MERCHANT_ID;
        const merchant_secret = process.env.PAYHERE_SECRET;

        if (!merchant_id || !merchant_secret) {
            return res.status(500).json({ error: "Payment gateway not configured" });
        }

        const hashedSecret = crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase();
        
        const amountFormatted = parseFloat(amount).toFixed(2);
        const hashString = merchant_id + order_id + amountFormatted + currency + hashedSecret;
        
        const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

        res.status(200).json({
            hash: hash,
            merchant_id: merchant_id,
            currency: currency || 'LKR',
            amount: amountFormatted,
            order_id: order_id
        });
    } catch (error) {
        console.error("Error generating PayHere hash:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
