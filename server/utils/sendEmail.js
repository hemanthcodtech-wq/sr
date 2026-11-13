const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer Transporter
 * Supports Gmail App Password (16 characters) or custom SMTP.
 */
const createTransporter = () => {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD || '';
  const pass = rawPass.trim().replace(/['"]/g, '').replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user,
        pass,
      },
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Send Email utility
 * @param {Object} options - { to, subject, html, text, attachments }
 */
const sendEmail = async ({ to, subject, html, text, attachments }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(
      `[Nodemailer Notice] EMAIL_USER / EMAIL_PASS not configured in .env. Email to "${to}" was logged instead.`
    );
    return {
      success: false,
      isSimulated: true,
      message: 'EMAIL_USER/EMAIL_PASS not configured in server/.env',
    };
  }

  const fromAddress = process.env.EMAIL_FROM || `"SR Marketplace" <${process.env.EMAIL_USER || 'support@srmarketplace.com'}>`;

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    text,
    html,
  };

  if (Array.isArray(attachments) && attachments.length > 0) {
    mailOptions.attachments = attachments;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Nodemailer] Email successfully sent to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Nodemailer Error] Failed to send email to ${to}:`, err.message);
    throw err;
  }
};

/**
 * Generate official Membership Tax Invoice HTML
 */
const generateMembershipInvoiceHtml = ({
  invoiceNumber,
  invoiceDate,
  vendorName,
  storeName,
  vendorEmail,
  vendorPhone,
  storeAddress,
  planTitle,
  planDurationDays,
  planExpiresAt,
  enrollmentFee,
  paymentId,
}) => {
  const grandTotal = Number(enrollmentFee || 999);
  const taxableValue = Math.round((grandTotal / 1.18) * 100) / 100;
  const gstAmount = Math.round((grandTotal - taxableValue) * 100) / 100;
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = Math.round((gstAmount / 2) * 100) / 100;

  const formattedDate = invoiceDate
    ? new Date(invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const formattedExpiry = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '1 Year';

  const addressText = storeAddress
    ? [storeAddress.street, storeAddress.city, storeAddress.state, storeAddress.zipCode].filter(Boolean).join(', ')
    : 'Registered Merchant Address';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(7, 29, 66, 0.08); overflow: hidden; }
    .header-banner { background: linear-gradient(135deg, #071d42 0%, #0f3460 100%); padding: 32px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; }
    .brand-title { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0; color: #ffffff; }
    .brand-accent { color: #f59e0b; }
    .sub-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #fbbf24; margin-top: 4px; font-weight: 700; }
    .badge-paid { display: inline-block; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 28px 32px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .info-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0 0 8px 0; font-weight: 700; }
    .info-block p { margin: 0 0 4px 0; font-size: 13px; color: #1e293b; line-height: 1.5; }
    .table-container { padding: 28px 32px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; padding: 12px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 2px solid #cbd5e1; }
    td { padding: 14px; font-size: 13px; border-bottom: 1px solid #e2e8f0; color: #1e293b; vertical-align: top; }
    .totals-area { padding: 0 32px 28px 32px; display: flex; justify-content: flex-end; }
    .totals-box { width: 320px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
    .totals-row.grand-total { border-top: 2px solid #071d42; padding-top: 10px; margin-top: 6px; font-size: 16px; font-weight: 900; color: #071d42; }
    .footer-note { background: #071d42; color: #94a3b8; padding: 20px 32px; text-align: center; font-size: 11px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header-banner">
      <div>
        <h1 class="brand-title">SR <span class="brand-accent">Marketplace</span></h1>
        <div class="sub-title">Official Tax &amp; Membership Invoice</div>
        <div style="font-size: 11px; color: #93c5fd; margin-top: 4px;">SAC: 998313 (E-Commerce Platform Services) • GSTIN: 37AAECS9821K1ZN</div>
      </div>
      <div style="text-align: right;">
        <span class="badge-paid">✓ PAID &amp; CONFIRMED</span>
        <div style="font-size: 15px; font-weight: 800; font-family: monospace; color: #ffffff; margin-top: 8px;">#${invoiceNumber}</div>
        <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">Date: ${formattedDate}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h4>Billed To (Merchant / Vendor):</h4>
        <p><strong>${storeName}</strong></p>
        <p>Merchant: ${vendorName || 'Valued Merchant'}</p>
        <p>Email: ${vendorEmail || 'Registered Email'}</p>
        <p>Phone: ${vendorPhone || 'N/A'}</p>
        <p style="font-size: 12px; color: #64748b;">${addressText}</p>
      </div>
      <div class="info-block" style="text-align: right;">
        <h4>Platform Issuer:</h4>
        <p><strong>SR Marketplace Enterprise Portal</strong></p>
        <p>Merchant Operations Division</p>
        <p>Email: support@srmarketplace.com</p>
        <p>Payment ID: <strong style="font-family: monospace;">${paymentId || 'RAZORPAY_VERIFIED'}</strong></p>
        <p style="font-size: 12px; color: #059669; font-weight: 700;">Status: Store Live &amp; Dashboard Active</p>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th>Description of Services</th>
            <th style="text-align: center; width: 100px;">Validity</th>
            <th style="text-align: right; width: 100px;">Taxable Value</th>
            <th style="text-align: right; width: 90px;">GST (18%)</th>
            <th style="text-align: right; width: 110px;">Total (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center; font-weight: 600; color: #64748b;">1</td>
            <td>
              <div style="font-weight: 800; color: #0f172a;">${planTitle || 'Merchant Store Enrollment & Dashboard Access'}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                Complete digital storefront, multi-category inventory hosting, centralized courier logistics &amp; vendor admin tools. Valid until <strong>${formattedExpiry}</strong>.
              </div>
            </td>
            <td style="text-align: center; font-weight: 700; color: #0f172a;">${planDurationDays || 365} Days</td>
            <td style="text-align: right; font-family: monospace; font-size: 13px;">₹${taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right; font-family: monospace; font-size: 12px; color: #64748b;">₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right; font-weight: 800; font-family: monospace; color: #071d42;">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="totals-area">
      <div class="totals-box">
        <div class="totals-row">
          <span>Taxable Subtotal:</span>
          <span>₹${taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="totals-row">
          <span>CGST (9%):</span>
          <span>₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="totals-row">
          <span>SGST (9%):</span>
          <span>₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="totals-row grand-total">
          <span>Total Paid (INR):</span>
          <span>₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <div class="footer-note">
      This is a digitally generated tax invoice authorized by SR Marketplace.<br/>
      No physical signature required. For any billing queries, please write to support@srmarketplace.com.
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Generate formatted HTML email template for 6-digit OTP verification
 */
const getOtpEmailTemplate = (otp, recipientEmail) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - SR Marketplace</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(7, 29, 66, 0.08);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #071d42 0%, #0f3460 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">
          SR <span style="color: #f59e0b;">Marketplace</span>
        </h1>
        <p style="color: #cbd5e1; font-size: 13px; font-weight: 500; margin: 8px 0 0 0; letter-spacing: 0.3px;">
          Premium Multi-Vendor Commerce Platform
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 36px 32px;">
        <div style="display: inline-block; padding: 4px 12px; background-color: #eff6ff; color: #1d4ed8; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
          Security Verification
        </div>
        <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Verify Your Email Address</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          Hello, we received a request to verify the email address <strong>${recipientEmail}</strong> for your SR Marketplace account.
        </p>

        <!-- OTP Code Box -->
        <div style="margin: 28px 0; padding: 24px 20px; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; border: 2px dashed #94a3b8; text-align: center;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1.5px; margin-bottom: 8px;">
            Your 6-Digit One-Time Password
          </div>
          <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #071d42; font-family: 'Courier New', Courier, monospace; margin: 6px 0;">
            ${otp}
          </div>
          <div style="font-size: 12px; color: #dc2626; font-weight: 600; margin-top: 10px;">
            ⏳ Valid for 10 minutes only • Single use
          </div>
        </div>

        <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0 0 20px 0;">
          Please enter this code on the verification screen to proceed. If you did not initiate this request, you can safely disregard this email.
        </p>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px;">
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
            <strong>Security Notice:</strong> SR Marketplace representatives will never ask for your password or OTP code over phone, WhatsApp, or email.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
        © 2026 SR Marketplace. All Rights Reserved.<br/>
        Partner Operations &amp; Trust Assurance
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Generate formatted HTML email template when Admin approves a merchant's store KYC
 */
const getStoreApprovalEmailTemplate = ({ vendorName, storeName, enrollmentFee, planDurationDays, loginLink }) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Store Approved - SR Marketplace</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(7, 29, 66, 0.08);">
      <div style="background: linear-gradient(135deg, #071d42 0%, #059669 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0;">
          SR <span style="color: #f59e0b;">Marketplace</span>
        </h1>
        <p style="color: #a7f3d0; font-size: 13px; font-weight: 600; margin: 6px 0 0 0;">
          Official Merchant Partnership Program
        </p>
      </div>

      <div style="padding: 36px 32px;">
        <div style="display: inline-block; padding: 4px 12px; background-color: #ecfdf5; color: #059669; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">
          ✓ KYC &amp; Verification Complete
        </div>
        <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 12px 0;">
          Congratulations, ${vendorName || 'Merchant'}!
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          Your merchant application and KYC documents for <strong>${storeName}</strong> have been reviewed and <strong style="color: #059669;">APPROVED</strong> by SR Marketplace administration!
        </p>

        <!-- Activation Steps Box -->
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 16px; padding: 24px; margin: 24px 0;">
          <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Next Step: Activate Your Store</h3>
          <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">
            To launch your public storefront and unlock the Merchant Seller Dashboard for <strong>${planDurationDays || 365} days</strong>, please complete your enrollment fee payment of <strong>₹${Number(enrollmentFee || 999).toLocaleString('en-IN')}</strong>. An official tax invoice will be generated and attached upon activation.
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Store Name:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${storeName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Enrollment Charge:</td>
              <td style="padding: 8px 0; font-weight: 800; color: #071d42; text-align: right;">₹${Number(enrollmentFee || 999).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Plan Validity:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #059669; text-align: right;">${planDurationDays || 365} Days</td>
            </tr>
          </table>

          <div style="text-align: center;">
            <a href="${loginLink || 'http://localhost:5173/vendor/register'}" style="display: inline-block; background-color: #071d42; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(7, 29, 66, 0.2);">
              Pay ₹${Number(enrollmentFee || 999).toLocaleString('en-IN')} &amp; Activate Store →
            </a>
          </div>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 0;">
          Need help? Contact our Merchant Success Desk at <strong>support@srmarketplace.com</strong>.
        </p>
      </div>

      <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © 2026 SR Marketplace • Merchant Operations Division
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Generate formatted HTML email template when a Store is fully Activated & Live
 * (Includes embedded Tax Invoice Summary & points to attached official Invoice HTML file)
 */
const getStoreActivatedEmailTemplate = ({
  vendorName,
  storeName,
  planTitle,
  planDurationDays,
  planExpiresAt,
  enrollmentFee,
  invoiceNumber,
  paymentId,
  dashboardLink,
  publicStoreLink,
}) => {
  const formattedExpiry = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '1 Year';

  const amountPaid = Number(enrollmentFee || 999);
  const taxable = Math.round((amountPaid / 1.18) * 100) / 100;
  const gst = Math.round((amountPaid - taxable) * 100) / 100;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Store is Live - SR Marketplace</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(7, 29, 66, 0.08);">
      
      <!-- Top Brand Header -->
      <div style="background: linear-gradient(135deg, #071d42 0%, #0f3460 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0;">
          SR <span style="color: #f59e0b;">Marketplace</span>
        </h1>
        <p style="color: #bfdbfe; font-size: 13px; font-weight: 600; margin: 6px 0 0 0;">
          🎉 Store Live &amp; Dashboard Active
        </p>
      </div>

      <div style="padding: 36px 32px;">
        <div style="display: inline-block; padding: 4px 12px; background-color: #ecfdf5; color: #059669; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">
          ✓ Verified Merchant Store
        </div>
        <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 12px 0;">
          Congratulations! ${storeName} is Live!
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          Hello ${vendorName || 'Merchant'}, your store enrollment payment of <strong>₹${amountPaid.toLocaleString('en-IN')}</strong> has been confirmed. Your official storefront is now active and publicly visible to customers across India on SR Marketplace.
        </p>

        <!-- Subscription Status Box -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 20px; margin: 20px 0;">
          <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Subscription Status</div>
          <div style="font-size: 16px; font-weight: 800; color: #15803d;">
            ${planTitle || 'Active Merchant Plan'} (${planDurationDays || 365} Days)
          </div>
          <div style="font-size: 12px; color: #166534; margin-top: 4px;">
            Valid until: <strong>${formattedExpiry}</strong>. Storefront visibility &amp; seller dashboard unlocked.
          </div>
        </div>

        <!-- Official Tax Invoice Capsule -->
        <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #cbd5e1; border-radius: 16px; padding: 20px; margin: 24px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #071d42; letter-spacing: 1px;">Official Tax Invoice</div>
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; font-family: monospace;">#${invoiceNumber || 'INV-SR-PLAN-CONFIRMED'}</div>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">PAID</span>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Ref: ${paymentId || 'RZP_VERIFIED'}</div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 12px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Taxable Base Fee:</td>
              <td style="padding: 4px 0; font-weight: 600; text-align: right; color: #0f172a;">₹${taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">GST (18%):</td>
              <td style="padding: 4px 0; font-weight: 600; text-align: right; color: #64748b;">₹${gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-top: 1px dashed #cbd5e1;">
              <td style="padding: 8px 0 0 0; font-weight: 800; color: #071d42; font-size: 14px;">Total Amount Paid:</td>
              <td style="padding: 8px 0 0 0; font-weight: 900; text-align: right; color: #071d42; font-size: 15px;">₹${amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>

          <div style="font-size: 11px; color: #059669; font-weight: 600; text-align: center; background-color: #ecfdf5; padding: 8px; border-radius: 8px;">
            📎 An official downloadable copy of this tax invoice (<strong>Invoice-${invoiceNumber || 'SR-PLAN'}.html</strong>) is attached to this email.
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="margin: 28px 0; text-align: center;">
          <a href="${dashboardLink || 'http://localhost:5173/vendor/dashboard'}" style="display: inline-block; margin: 6px; background-color: #071d42; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 12px 24px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(7, 29, 66, 0.2);">
            Open Merchant Dashboard →
          </a>
          <a href="${publicStoreLink || 'http://localhost:5173/stores'}" style="display: inline-block; margin: 6px; background-color: #f1f5f9; color: #071d42; text-decoration: none; font-size: 14px; font-weight: 800; padding: 12px 24px; border-radius: 10px; border: 1px solid #cbd5e1;">
            View Public Storefront
          </a>
        </div>

        <!-- Catalog & Products Rules Information -->
        <div style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; padding: 20px; margin-top: 24px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #071d42; margin: 0 0 10px 0;">Product Options For Your Store:</h3>
          <ul style="font-size: 12.5px; color: #475569; line-height: 1.7; padding-left: 20px; margin: 0;">
            <li><strong>1. Your Own Products:</strong> Add your custom products to your store, set your prices, and handle your own order dispatch.</li>
            <li><strong>2. Sourced Admin Catalog Products:</strong> Request permission from Admin to list premium admin products. Once approved, you can select items from the Admin Catalog and sell them at the fixed admin price, with centralized express dispatch handled by SR Marketplace!</li>
          </ul>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © 2026 SR Marketplace • Merchant Operations Division
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Generate formatted HTML email template when a merchant earns a referral reward
 */
const getReferralRewardEmailTemplate = ({ referrerName, bonusAmount, newWalletBalance, referredStoreName }) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Referral Reward Credited - SR Marketplace</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(7, 29, 66, 0.08);">
      <div style="background: linear-gradient(135deg, #071d42 0%, #d97706 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0;">
          SR <span style="color: #fef08a;">Marketplace</span>
        </h1>
        <p style="color: #fef3c7; font-size: 13px; font-weight: 600; margin: 6px 0 0 0;">
          💰 Merchant Partner Referral Program
        </p>
      </div>

      <div style="padding: 36px 32px;">
        <div style="display: inline-block; padding: 4px 12px; background-color: #fef3c7; color: #b45309; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">
          ✓ Reward Credited
        </div>
        <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 12px 0;">
          You Just Earned ₹${bonusAmount || 500}!
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          Great news, ${referrerName || 'Partner'}! A merchant you referred — <strong>"${referredStoreName}"</strong> — has been verified and activated by Admin.
        </p>

        <!-- Reward Card -->
        <div style="background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fde68a; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
          <div style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">Referral Bonus Credited</div>
          <div style="font-size: 40px; font-weight: 900; color: #b45309; margin: 8px 0;">
            +₹${Number(bonusAmount || 500).toLocaleString('en-IN')}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #78350f;">
            Your New Wallet Balance: ₹${Number(newWalletBalance || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
          You can request a direct settlement withdrawal from your Vendor Wallet into your registered bank account at any time.
        </p>

        <div style="text-align: center;">
          <a href="http://localhost:5173/vendor/wallet" style="display: inline-block; background-color: #071d42; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px;">
            Go to Your Vendor Wallet →
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © 2026 SR Marketplace • Partner Referral Desk
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Generate formatted HTML email template for Contact Us inquiry
 */
const getContactConfirmationEmailTemplate = ({ senderName, subject }) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Inquiry Received - SR Marketplace Support</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(7, 29, 66, 0.08);">
      <div style="background-color: #071d42; padding: 28px 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0;">
          SR <span style="color: #f59e0b;">Marketplace</span>
        </h1>
        <p style="color: #93c5fd; font-size: 13px; margin: 6px 0 0 0;">Customer Care &amp; Partner Desk</p>
      </div>

      <div style="padding: 36px 32px;">
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0;">We Received Your Message</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Hello ${senderName || 'Valued Customer'},
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Thank you for reaching out regarding <strong>"${subject || 'General Inquiry'}"</strong>. Our customer support team has received your inquiry and is reviewing it.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          We typically respond within 2 to 4 business hours. If your issue is urgent, you can also write to <strong>support@srmarketplace.com</strong>.
        </p>
      </div>

      <div style="background-color: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © 2026 SR Marketplace. All Rights Reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = {
  sendEmail,
  generateMembershipInvoiceHtml,
  getOtpEmailTemplate,
  getStoreApprovalEmailTemplate,
  getStoreActivatedEmailTemplate,
  getReferralRewardEmailTemplate,
  getContactConfirmationEmailTemplate,
};
