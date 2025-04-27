// In utils/emailService.js:

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use Gmail or other email service
  auth: {
    user: process.env.GMAIL_USER,  
    pass: process.env.GMAIL_PASS,  
  },
});

const sendReminderEmail = (to, subject, text) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendReminderEmail };
