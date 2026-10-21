const Razorpay = require('razorpay');
const crypto = require('crypto');

const isRazorpayConfigured = () => {
  return (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder_key' &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET !== 'rzp_test_placeholder_secret'
  );
};

let razorpayInstance = null;

if (isRazorpayConfigured()) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Create a Razorpay Order or simulated test order
 */
const createRazorpayOrder = async (amountInINR, receiptId, notes = {}) => {
  const amountInPaise = Math.round(amountInINR * 100);

  if (isRazorpayConfigured() && razorpayInstance) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes,
      });
      return { isMock: false, order };
    } catch (err) {
      console.warn('Real Razorpay API error, falling back to mock mode:', err.message);
    }
  }

  // Mock / Sandbox Order for local dev & testing
  const mockOrder = {
    id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    entity: 'order',
    amount: amountInPaise,
    amount_paid: 0,
    amount_due: amountInPaise,
    currency: 'INR',
    receipt: receiptId,
    status: 'created',
    attempts: 0,
    notes,
    created_at: Math.floor(Date.now() / 1000),
  };

  return { isMock: true, order: mockOrder };
};

/**
 * Verify Razorpay payment signature
 */
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  if (orderId && orderId.startsWith('order_mock_')) {
    // Simulated test verification passes
    return true;
  }

  if (!isRazorpayConfigured()) {
    return true;
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
};

module.exports = {
  razorpayInstance,
  isRazorpayConfigured,
  createRazorpayOrder,
  verifyRazorpaySignature,
};
