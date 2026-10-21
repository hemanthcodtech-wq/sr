const express = require('express');
const router = express.Router();
const { sendEmail, getContactConfirmationEmailTemplate } = require('../utils/sendEmail');

// In-memory inquiry store for logging/auditing
const contactInquiries = [];

// @desc    Submit Contact Us Inquiry
// @route   POST /api/contact
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, subject, inquiryType, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.',
      });
    }

    const inquiry = {
      _id: `inq_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      subject: subject || 'General Inquiry',
      inquiryType: inquiryType || 'Support',
      message,
      createdAt: new Date(),
    };

    contactInquiries.unshift(inquiry);
    console.log(`[Amezon Contact] New inquiry received from ${name} (${email}): "${subject}"`);

    // Dispatch confirmation email to sender
    try {
      await sendEmail({
        to: email.toLowerCase(),
        subject: `We Received Your Inquiry: "${subject || 'General Inquiry'}" - Amezon.online`,
        text: `Hello ${name},\n\nThank you for contacting Amezon.online. We received your message regarding "${subject}" and our team is reviewing it.\n\nBest regards,\nAmezon.online Support Team`,
        html: getContactConfirmationEmailTemplate({
          senderName: name,
          subject: subject || 'General Inquiry',
        }),
      });
    } catch (mailErr) {
      console.warn('[Contact Email Dispatch Note]', mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Thank you for reaching out! Your message has been received. Our support team will get back to you shortly.',
      inquiryId: inquiry._id,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get recent contact inquiries (for admin review)
// @route   GET /api/contact
// @access  Public/Admin
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    count: contactInquiries.length,
    inquiries: contactInquiries,
  });
});

module.exports = router;
