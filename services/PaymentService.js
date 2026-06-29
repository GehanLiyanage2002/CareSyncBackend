const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

class PaymentService {
  static async generateHash(bodyData) {
    const { order_id, amount, currency } = bodyData;
    const merchant_id = process.env.PAYHERE_MERCHANT_ID;
    const merchant_secret = process.env.PAYHERE_SECRET;

    if (!merchant_id || !merchant_secret) {
        throw new ApiError(500, 'Payment gateway not configured');
    }

    const hashedSecret = crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase();
    
    const amountFormatted = parseFloat(amount).toFixed(2);
    const hashString = merchant_id + order_id + amountFormatted + currency + hashedSecret;
    
    const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

    return {
        hash: hash,
        merchant_id: merchant_id,
        currency: currency || 'LKR',
        amount: amountFormatted,
        order_id: order_id
    };
  }
}

module.exports = PaymentService;
