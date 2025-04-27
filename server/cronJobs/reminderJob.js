const cron = require('node-cron');
const Note = require('../models/Notes');
const User = require('../models/User');
const { sendReminderEmail } = require('../utils/emailService');


cron.schedule('* 8 * * *', async () => {
  console.log('Running daily reminder job...');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);  

    const notes = await Note.find({
      rememberDate: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    for (const note of notes) {
    
      const user = await User.findOne({ googleId: note.user });  
      if (user && user.email) {
        const subject = `Reminder: ${note.title}`;
        const text = `Hello ${user.firstName},\n\nJust a reminder for your note: "${note.title}".\n\nHave a great day!`;


        await sendReminderEmail(user.email, subject, text);
        console.log(`Email sent to ${user.email}`);
      } else {
        console.log(`User or email not found for note: ${note.title}`);
      }
    }
  } catch (error) {
    console.error('Error in reminder job:', error);
  }
});
