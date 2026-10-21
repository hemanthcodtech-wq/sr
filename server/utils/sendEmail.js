const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer Transporter
 * Supports Gmail App Password (16 characters) or custom SMTP.
 *
 * For Gmail:
 * EMAIL_USER = your-gmail@gmail.com
 * EMAIL_PASS = 16-character Google App Password (e.g. 'abcd efgh ijkl mnop')
 */
const createTransporter = () => {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD || '';
  const pass = rawPass.trim().replace(/['"]/g, '').replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  // If custom SMTP host is specified
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

  // Standard Gmail Service using App Password
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
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(
      `[Nodemailer Notice] EMAIL_USER / EMAIL_PASS not configured in .env. Verification email to "${to}" was logged instead.`
    );
    return {
      success: false,
      isSimulated: true,
      message: 'EMAIL_USER/EMAIL_PASS not configured in server/.env',
    };
  }

  const fromAddress = process.env.EMAIL_FROM || `"Amezon.online" <${process.env.EMAIL_USER}>`;

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    text,
    html,
  };

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
 * Generate formatted HTML email template for 6-digit OTP verification
 */
const getOtpEmailTemplate = (otp, recipientEmail) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Amezon.online</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(12, 42, 94, 0.08);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0c2a5e 0%, #1e40af 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">
          Amezon<span style="color: #f59e0b;">.online</span>
        </h1>
        <p style="color: #bfdbfe; font-size: 13px; font-weight: 500; margin: 8px 0 0 0; letter-spacing: 0.3px;">
          India's Ethical Multi-Vendor Commerce Platform
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 36px 32px;">
        <div style="display: inline-block; padding: 4px 12px; background-color: #eff6ff; color: #1d4ed8; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
          Security Verification
        </div>
        <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Verify Your Email Address</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          Hello, we received a request to verify the email address <strong>${recipientEmail}</strong> for your Amezon.online account.
        </p>

        <!-- OTP Code Box -->
        <div style="margin: 28px 0; padding: 24px 20px; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; border: 2px dashed #94a3b8; text-align: center;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1.5px; margin-bottom: 8px;">
            Your 6-Digit One-Time Password
          </div>
          <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #0c2a5e; font-family: 'Courier New', Courier, monospace; margin: 6px 0;">
            ${otp}
          </div>
          <div style="font-size: 12px; color: #dc2626; font-weight: 600; margin-top: 10px;">
            ⏳ Valid for 10 minutes only • Single use
          </div>
        </div>

        <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0 0 20px 0;">
          Please enter this code on the registration verification screen. If you did not initiate this request, you can safely disregard this email.
        </p>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px;">
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
            <strong>Security Notice:</strong> Amezon representatives will NEVER ask for your password or OTP code over phone, WhatsApp, or email. Keep this code confidential.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
        © 2026 Amezon.online. All Rights Reserved.<br/>
        Amezon Commercial Complex, Main Road, Bhimavaram, AP – 534201, India.
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
    <title>Store Approved - Amezon.online</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(12, 42, 94, 0.08);">
      <div style="background: linear-gradient(135deg, #0c2a5e 0%, #059669 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0;">
          Amezon<span style="color: #f59e0b;">.online</span>
        </h1>
        <p style="color: #a7f3d0; font-size: 13px; font-weight: 600; margin: 6px 0 0 0;">
          Official Merchant Partnership Program
        </p>
      </div>

      <div style="padding: 36px 32px;">
        <div style="display: inline-block; padding: 4px 12px; background-color: #ecfdf5; color: #059669; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">
          ✓ KYC & Documents Verified
        </div>
        <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 12px 0;">
          Congratulations, ${vendorName || 'Merchant'}!
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          Your merchant application and KYC documents (Aadhaar & PAN) for <strong>${storeName}</strong> have been reviewed and <strong style="color: #059669;">APPROVED</strong> by our platform administration!
        </p>

        <!-- Activation Steps Box -->
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 16px; padding: 24px; margin: 24px 0;">
          <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Next Step: Activate Your Store</h3>
          <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">
            To launch your official public storefront and unlock the Merchant Seller Dashboard for <strong>${planDurationDays || 365} days</strong>, please complete the platform enrollment fee payment of <strong>₹${Number(enrollmentFee || 999).toLocaleString('en-IN')}</strong> via Razorpay.
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Store Name:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${storeName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Enrollment Charge:</td>
              <td style="padding: 8px 0; font-weight: 800; color: #0c2a5e; text-align: right;">₹${Number(enrollmentFee || 999).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Plan Validity:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #059669; text-align: right;">${planDurationDays || 365} Days (1 Year)</td>
            </tr>
          </table>

          <div style="text-align: center;">
            <a href="${loginLink || 'http://localhost:5173/vendor/register'}" style="display: inline-block; background-color: #0c2a5e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(12, 42, 94, 0.2);">
              Pay ₹${Number(enrollmentFee || 999).toLocaleString('en-IN')} via Razorpay & Activate Store →
            </a>
          </div>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 0;">
          Need help? Contact our Merchant Success Desk at <strong>support@amezon.online</strong> or call <strong>+91 98765 43210</strong>.
        </p>
      </div>

      <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © 2026 Amezon.online • Merchant Operations • Bhimavaram, AP – 534201
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Generate formatted HTML email template when a Store is fully Activated & Live
 */
const getStoreActivatedEmailTemplate = ({ vendorName, storeName, planDurationDays, planExpiresAt, dashboardLink, publicStoreLink }) => {
  const formattedExpiry = planExpiresAt ? new Date(planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '1 Year';
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Store is Live - Amezon.online</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(12, 42, 94, 0.08);">
      <div style="background: linear-gradient(135deg, #0c2a5e 0%, #1e40af 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0;">
          Amezon<span style="color: #f59e0b;">.online</span>
        </h1>
        <p style="color: #bfdbfe; font-size: 13px; font-weight: 600; margin: 6px 0 0 0;">
          🎉 Store Live &amp; Dashboard Active
        </p>
      </div>

      <div style="padding: 36px 32px;">
        <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 12px 0;">
          Congratulations! ${storeName} is Live!
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          Hello ${vendorName || 'Merchant'}, your store enrollment payment has been verified. Your official storefront is now publicly visible to customers across India on Amezon.online.
        </p>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 20px; margin: 20px 0;">
          <div style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; margin-bottom: 6px;">Subscription Status</div>
          <div style="font-size: 16px; font-weight: 800; color: #15803d;">
            Active Plan (${planDurationDays || 365} Days)
          </div>
          <div style="font-size: 12px; color: #166534; margin-top: 4px;">
            Valid until: <strong>${formattedExpiry}</strong>. Storefront visibility & seller dashboard unlocked.
          </div>
        </div>

        <div style="margin: 28px 0; text-align: center;">
          <a href="${dashboardLink || 'http://localhost:5173/vendor/dashboard'}" style="display: inline-block; margin: 6px; background-color: #0c2a5e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 12px 24px; border-radius: 10px;">
            Open Merchant Dashboard →
          </a>
          <a href="${publicStoreLink || 'http://localhost:5173/stores'}" style="display: inline-block; margin: 6px; background-color: #f1f5f9; color: #0c2a5e; text-decoration: none; font-size: 14px; font-weight: 800; padding: 12px 24px; border-radius: 10px; border: 1px solid #cbd5e1;">
            View Public Storefront
          </a>
        </div>

        <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 20px 0 8px 0;">What you can do now:</h3>
        <ul style="font-size: 13px; color: #475569; line-height: 1.7; padding-left: 20px; margin: 0;">
          <li>Add products with descriptions, prices, stock, and high-definition photos</li>
          <li>Receive direct customer orders and print shipping invoices</li>
          <li>Fulfill orders with reliable courier delivery across India</li>
          <li>Refer other merchants and earn ₹500 in your wallet for every approved store!</li>
        </ul>
      </div>

      <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © 2026 Amezon.online • Merchant Operations • Bhimavaram, AP – 534201
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
    <title>Referral Reward Credited - Amezon.online</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(12, 42, 94, 0.08);">
      <div style="background: linear-gradient(135deg, #0c2a5e 0%, #d97706 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0;">
          Amezon<span style="color: #fef08a;">.online</span>
        </h1>
        <p style="color: #fef3c7; font-size: 13px; font-weight: 600; margin: 6px 0 0 0;">
          💰 Partner Referral Program
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
          Great news, ${referrerName || 'Partner'}! A merchant you referred — <strong>"${referredStoreName}"</strong> — has been verified and approved by Admin.
        </p>

        <!-- Reward Card -->
        <div style="background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fde68a; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
          <div style="font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">Referral Bonus Credited</div>
          <div style="font-size: 40px; font-weight: 900; color: #b45309; margin: 8px 0;">
            +₹${Number(bonusAmount || 500).toLocaleString('en-IN')}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #78350f;">
            Your New Wallet Balance: ₹${Number(newWalletBalance || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
          You can request a direct settlement withdrawal from your Vendor Wallet directly into your registered bank account at any time.
        </p>

        <div style="text-align: center;">
          <a href="http://localhost:5173/vendor/wallet" style="display: inline-block; background-color: #0c2a5e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px;">
            Go to Your Vendor Wallet →
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © 2026 Amezon.online • Partner Referral Desk • Bhimavaram, AP – 534201
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
    <title>Inquiry Received - Amezon.online Support</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(12, 42, 94, 0.08);">
      <div style="background-color: #0c2a5e; padding: 28px 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0;">
          Amezon<span style="color: #f59e0b;">.online</span>
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
          We typically respond within 2 to 4 business hours. If your issue is urgent, you can also reach us via phone at <strong>+91 98765 43210</strong> (Mon-Sat, 9 AM - 7 PM IST).
        </p>
      </div>

      <div style="background-color: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © 2026 Amezon.online. All Rights Reserved. • Bhimavaram, AP – 534201
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = {
  sendEmail,
  getOtpEmailTemplate,
  getStoreApprovalEmailTemplate,
  getStoreActivatedEmailTemplate,
  getReferralRewardEmailTemplate,
  getContactConfirmationEmailTemplate,
};

