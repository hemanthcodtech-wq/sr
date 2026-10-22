const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * Generate invoice HTML template and upload to Cloudinary (or return formatted invoice)
 */
const generateInvoice = async (order) => {
  const grandTotal = Number(order.totalAmount || 0);
  const taxableValue = Math.round((grandTotal / 1.18) * 100) / 100;
  const totalGst = Math.round((grandTotal - taxableValue) * 100) / 100;
  const cgst = Math.round((totalGst / 2) * 100) / 100;
  const sgst = Math.round((totalGst / 2) * 100) / 100;

  const itemsHtml = (order.items || [])
    .map(
      (item, idx) => {
        const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
        const itemTaxable = Math.round((itemTotal / 1.18) * 100) / 100;
        const itemGst = Math.round((itemTotal - itemTaxable) * 100) / 100;
        return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">${idx + 1}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a;">${item.title}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;">${item.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px;">₹${item.price?.toLocaleString('en-IN')}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 12px; color: #64748b;">₹${itemTaxable.toLocaleString('en-IN')}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 12px; color: #64748b;">18% (₹${itemGst.toLocaleString('en-IN')})</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">₹${itemTotal.toLocaleString('en-IN')}</td>
        </tr>
      `;
      }
    )
    .join('');

  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Tax Invoice - ${order.invoiceNumber}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #1e293b; padding: 25px; }
        .invoice-card { max-width: 820px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 35px; box-shadow: 0 4px 6px rgba(0,0,0,0.03); }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0c2a5e; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: 900; color: #0c2a5e; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; margin-top: 25px; gap: 25px; padding: 18px; background: #f8fafc; border-radius: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
        th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
        .total-box { margin-top: 25px; text-align: right; font-size: 15px; }
        .footer { margin-top: 35px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <div class="title">SR Multi-Vendor Marketplace</div>
            <div style="font-size: 11px; color: #b45309; font-weight: bold; letter-spacing: 0.5px;">DREAM • GROW • TOGETHER</div>
            <div style="font-size: 11.5px; color: #64748b; margin-top: 4px;">GST Registered • CIN: U72200TG2026PTC189210</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 15px; font-weight: 800; font-family: monospace;">Invoice #${order.invoiceNumber}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${invoiceDate}</div>
            <div style="font-size: 12px; color: #047857; font-weight: bold; margin-top: 3px;">Status: ${order.paymentStatus?.toUpperCase() || 'PAID'}</div>
          </div>
        </div>

        <div class="details-grid">
          <div>
            <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #475569;">Billed &amp; Shipped To:</h4>
            <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${order.shippingAddress?.fullName || 'Valued Customer'}</div>
            <div style="font-size: 12.5px; color: #475569; margin-top: 2px;">${order.shippingAddress?.street}</div>
            <div style="font-size: 12.5px; color: #475569;">${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.zipCode}</div>
            <div style="font-size: 12.5px; color: #475569; margin-top: 3px;">Phone: <strong>${order.shippingAddress?.phone}</strong></div>
          </div>
          <div style="text-align: right;">
            <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #475569;">Payment &amp; Dispatch Info:</h4>
            <div style="font-size: 13px; color: #334155;">Method: <strong>${order.paymentMethod}</strong></div>
            <div style="font-size: 12.5px; color: #64748b; margin-top: 2px;">Payment Ref: ${order.razorpayPaymentId || 'WALLET-SETTLED'}</div>
            <div style="font-size: 12.5px; color: #64748b;">Tracking AWB: <strong>${order.trackingNumber || 'AWB982187319'}</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 35px;">#</th>
              <th>Item Description</th>
              <th style="text-align: center; width: 50px;">Qty</th>
              <th style="text-align: right; width: 90px;">Price</th>
              <th style="text-align: right; width: 90px;">Taxable</th>
              <th style="text-align: right; width: 100px;">GST (18%)</th>
              <th style="text-align: right; width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-box">
          <div style="font-size: 12.5px; color: #64748b; margin-bottom: 4px;">Taxable Amount: ₹${taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div style="font-size: 12.5px; color: #64748b; margin-bottom: 4px;">CGST + SGST (18%): ₹${totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div style="font-size: 12.5px; color: #047857; margin-bottom: 6px;">Express Shipping: <strong>FREE</strong></div>
          <div style="font-size: 18px; font-weight: 900; color: #0c2a5e;">Grand Total: ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>

        <div class="footer">
          Thank you for shopping on SR Multi-Vendor Marketplace! For customer support, write to support@srmarketplace.com.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
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
