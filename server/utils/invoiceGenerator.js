const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * Generate invoice HTML template and upload to Cloudinary (or return formatted invoice)
 */
const generateInvoice = async (order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice - ${order.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; background: #ffffff; color: #1e293b; padding: 30px; }
        .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .title { font-size: 26px; font-weight: bold; color: #2563eb; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; margin-top: 25px; gap: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th { background: #f8fafc; padding: 12px 10px; text-align: left; font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        .total-box { margin-top: 25px; text-align: right; font-size: 18px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
            <div class="title" style="color: #d97706; font-weight: 900;">SR Multi-Vendor Marketplace</div>
            <div style="font-size: 11px; color: #b45309; font-weight: bold; letter-spacing: 1px;">DREAM • GROW • TOGETHER</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Official Tax Invoice & Receipt</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: bold;">Invoice #${order.invoiceNumber}</div>
            <div style="font-size: 12px; color: #64748b;">Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}</div>
            <div style="font-size: 12px; color: #16a34a; font-weight: bold;">Status: ${order.paymentStatus.toUpperCase()}</div>
          </div>
        </div>

        <div class="details-grid">
          <div>
            <h4 style="margin: 0 0 8px 0; color: #334155;">Billed To:</h4>
            <div style="font-weight: bold;">${order.shippingAddress.fullName}</div>
            <div style="font-size: 13px; color: #64748b;">${order.shippingAddress.street}</div>
            <div style="font-size: 13px; color: #64748b;">${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}</div>
            <div style="font-size: 13px; color: #64748b;">Phone: ${order.shippingAddress.phone}</div>
          </div>
          <div style="text-align: right;">
            <h4 style="margin: 0 0 8px 0; color: #334155;">Payment Info:</h4>
            <div style="font-size: 13px;">Method: ${order.paymentMethod}</div>
            <div style="font-size: 13px; color: #64748b;">Payment ID: ${order.razorpayPaymentId || 'N/A'}</div>
            <div style="font-size: 13px; color: #64748b;">Order Ref: ${order.razorpayOrderId || order._id}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-box">
          <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">Platform Shipping: <span style="color: #16a34a; font-weight: bold;">FREE</span></div>
          <div style="font-weight: bold; color: #0f172a;">Grand Total: ₹${order.totalAmount.toLocaleString('en-IN')}</div>
        </div>

        <div class="footer">
          Thank you for shopping on NexMart Marketplace! For support inquiries, contact support@nexmart.com.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Optionally save/upload buffer to Cloudinary
    const buffer = Buffer.from(invoiceHtml, 'utf-8');
    const uploadResult = await uploadToCloudinary(buffer, 'multivendor_invoices', `${order.invoiceNumber}.html`);
    return uploadResult.secure_url;
  } catch (err) {
    console.warn('Could not upload invoice directly to Cloudinary:', err.message);
    return `/api/orders/${order._id}/invoice-preview`;
  }
};

module.exports = {
  generateInvoice,
};
