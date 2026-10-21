require('dotenv').config();
const nodemailer = require('nodemailer');

const emailUser = (process.env.EMAIL_USER || '').trim();
const emailPass = (process.env.EMAIL_PASS || '').trim().replace(/['"]/g, '').replace(/\s+/g, '');

console.log('--- Testing Gmail SMTP Connection ---');
console.log('EMAIL_USER:', emailUser);
console.log('EMAIL_PASS length:', emailPass.length, `(First 2: ${emailPass.slice(0, 2)}..., Last 2: ...${emailPass.slice(-2)})`);

if (!emailUser || !emailPass) {
  console.error('\n❌ ERROR: EMAIL_USER or EMAIL_PASS is empty in server/.env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

transporter.verify(async (err) => {
  if (err) {
    console.error('\n❌ Google SMTP Authentication FAILED:');
    console.error(err.message);
    if (err.message.includes('535') || err.message.includes('BadCredentials')) {
      console.log('\n💡 Why did Google reject this?');
      console.log('1. Check if the App Password was generated for this exact email account (' + emailUser + ')');
      console.log('   (If you have multiple Google accounts logged in your browser, Google often generates the app password under Account 0 instead).');
      console.log('2. Ensure 2-Step Verification is turned ON for ' + emailUser);
      console.log('3. Generate a fresh 16-letter App Password at: https://myaccount.google.com/apppasswords');
    }
    process.exit(1);
  }

  console.log('\n✅ SUCCESS: Google SMTP authenticated successfully!');
  console.log('Now sending a test email to', emailUser, '...');

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || emailUser,
      to: emailUser,
      subject: 'Amezon.online - Test Email Delivery',
      text: 'Congratulations! Your Google SMTP App Password is working correctly.',
    });
    console.log('✅ Test email sent successfully! Message ID:', info.messageId);
    console.log('Please check your inbox at:', emailUser);
  } catch (sendErr) {
    console.error('❌ Failed to send email:', sendErr.message);
  }
});
